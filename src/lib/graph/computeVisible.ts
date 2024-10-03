import {
  newGraph,
  type NodeWithData,
  type Graph,
  type EdgeWithData,
  newRenderArea,
  globalStyle,
} from "@/lib/graph/layout";
import { type Viewport, type Rect } from "@xyflow/react";
import { getOverlappingArea } from "@xyflow/system";
import { differenceWith, isEmpty, keyBy } from "lodash-es";

export default function computeVisible(
  oldVisible: Graph,
  graph: Graph,
  nodeMap: Record<string, NodeWithData>,
  width: number,
  height: number,
  viewport: Viewport,
): { visible: Graph; changed: boolean } {
  if (width <= 0 || height <= 0 || viewport.zoom <= 0) {
    console.error("invalid viewport", width, height, viewport);
    return { visible: newGraph(), changed: true };
  } else if (graph.nodes.length <= 100) {
    return { visible: graph, changed: isVisibleChanged(oldVisible, graph) };
  }

  const viewportRect = getViewportRect(viewport, width, height);
  const { nodes, edges } = getNodesAndEdgesInViewport(viewportRect, graph);
  const visibleNodeMap: Record<string, NodeWithData> = {};

  nodes.forEach((node) => {
    const y = node.position.y;
    const h = node.data.height;
    node.data.renderArea = {
      kvStart: Math.floor((Math.max(viewportRect.y, y) - y) / globalStyle.kvHeight),
      kvEnd: Math.ceil((Math.min(viewportRect.y + viewportRect.height, y + h) - y) / globalStyle.kvHeight),
    };
    visibleNodeMap[node.id] = node;
  });

  // There are three scenarios:
  // 1. The source of the edge is in the viewport, but the target is not.
  // 2. The source of the edge is not in the viewport, but the target is.
  // 3. Neither the source nor the target of the edge is in the viewport.
  //
  // They correspond to three types of node scenarios:
  // 1. The source is a normal node, but some of its children are dummy handles, and the target is a DummyTargetNode.
  // 2. The source is a DummySourceNode, but the target is a normal node.
  // 3. Both the source and the target are dummy nodes.
  edges.forEach((edge) => {
    let sourceNode = visibleNodeMap[edge.source];

    if (!sourceNode) {
      sourceNode = newDummySourceNode(nodeMap[edge.source]);
      visibleNodeMap[sourceNode.id] = sourceNode;
      nodes.push(sourceNode);
    }

    // sourceHandleIndex will be in ascending order because the output from genFlowNodes is ordered.
    const i = edge.data!.sourceHandleIndex;
    const { kvStart, kvEnd } = sourceNode.data.renderArea;

    if (!(kvStart <= i && i < kvEnd)) {
      if (sourceNode.data.renderArea.dummyHandleStart === undefined) {
        sourceNode.data.renderArea.dummyHandleStart = i;
      }
      sourceNode.data.renderArea.dummyHandleEnd = i + 1;
    }

    if (!visibleNodeMap[edge.target]) {
      const dummyNode = newDummyTargetNode(edge);
      visibleNodeMap[dummyNode.id] = dummyNode;
      nodes.push(dummyNode);
    }
  });

  const visible = { nodes, edges };
  return { visible, changed: isVisibleChanged(oldVisible, visible) };
}

function getNodesAndEdgesInViewport(viewportRect: Rect, graph: Graph) {
  const isInViewport = (rect: Rect) => getOverlappingArea(rect, viewportRect) > 0;
  const isNodeInViewport = (node: NodeWithData) =>
    isInViewport({
      ...node.position,
      width: node.data.width,
      height: node.data.height,
    });
  const isEdgeInViewport = (edge: EdgeWithData) =>
    isInViewport({
      ...edge.data!.start,
      // end point will always in the right and bottom to start point
      width: edge.data!.end.x - edge.data!.start.x,
      height: edge.data!.end.y - edge.data!.start.y,
    });

  const nodes = graph.nodes.filter(isNodeInViewport);
  const edges = graph.edges.filter(isEdgeInViewport);
  return { nodes, edges };
}

// TODO: add to viewportRect
const smoothPaddingGap = 500;

export function getViewportRect(viewport: Viewport, width: number, height: number): Rect {
  return {
    x: -viewport.x / viewport.zoom,
    y: -viewport.y / viewport.zoom,
    width: width / viewport.zoom,
    height: height / viewport.zoom,
  };
}

function isVisibleChanged(oldGraph: Graph, newGraph: Graph) {
  if (!(oldGraph.nodes.length === newGraph.nodes.length && oldGraph.edges.length === newGraph.edges.length)) {
    return true;
  }

  const dd = differenceWith(
    oldGraph.nodes,
    newGraph.nodes,
    (oldNode, newNode) => oldNode.id === newNode.id && oldNode.type === newNode.type,
  );

  return !isEmpty(dd);
}

function newDummySourceNode(node: NodeWithData): NodeWithData {
  return {
    id: node.id,
    position: node.position,
    type: node.type,
    data: {
      level: 0,
      depth: 0,
      width: node.data.width,
      height: node.data.height,
      parentId: "",
      childrenIds: [],
      renderArea: newRenderArea(),
    },
    deletable: false,
    draggable: false,
  };
}

function newDummyTargetNode(edge: EdgeWithData): NodeWithData {
  return {
    id: edge.target,
    position: edge.data!.end,
    type: "dummyTarget",
    data: {
      level: 0,
      depth: 0,
      width: 1,
      height: 1,
      parentId: "",
      childrenIds: [],
      renderArea: newRenderArea(),
    },
    deletable: false,
    draggable: false,
  };
}
