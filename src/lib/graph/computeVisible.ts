import { newGraph, type NodeWithData, type Graph, type EdgeWithData, globalStyle } from "@/lib/graph/layout";
import { type Viewport, type Rect } from "@xyflow/react";
import { getOverlappingArea } from "@xyflow/system";
import { differenceWith, isEmpty } from "lodash-es";

export const refreshInterval = 30;
const smoothPaddingGap = 300;
const maxEdgesForDummy = 10;

// TODO: change word "visible" to "render"
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
    // When the number of nodes is small, we can skip the computation for a smoother user experience.
  } else if (graph.nodes.length <= 100) {
    return { visible: graph, changed: isVisibleChanged(oldVisible, graph) };
  }

  const viewportRect = getRenderRect(viewport, width, height);
  const visible = getNodesAndEdgesInViewport(viewportRect, graph);
  const visibleNodeMap = computeVisibleKvInViewport(viewportRect, visible.nodes);
  generateDummys(nodeMap, visibleNodeMap, visible);
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
      width: edge.data!.end.x - edge.data!.start.x,
      // height will be 0 when the edge is horizontal, so we set it to 1 to ensure the rect area > 0.
      height: Math.max(Math.abs(edge.data!.end.y - edge.data!.start.y), 1),
    });

  const nodes = graph.nodes.filter(isNodeInViewport);
  const edges = graph.edges.filter(isEdgeInViewport);
  return { nodes, edges };
}

function computeVisibleKvInViewport(viewportRect: Rect, nodes: NodeWithData[]) {
  const visibleNodeMap: Record<string, NodeWithData> = {};
  nodes.forEach((node) => {
    const y = node.position.y;
    const h = node.data.height;
    node.data.renderArea = {
      kvStart: Math.floor((Math.max(viewportRect.y, y) - y) / globalStyle.kvHeight),
      kvEnd: Math.ceil((Math.min(viewportRect.y + viewportRect.height, y + h) - y) / globalStyle.kvHeight),
      dummyHandleIndices: {},
    };
    visibleNodeMap[node.id] = node;
  });
  return visibleNodeMap;
}

function generateDummys(
  nodeMap: Record<string, NodeWithData>,
  renderMap: Record<string, NodeWithData>,
  { nodes, edges }: Graph,
) {
  const dummyMap: Record<
    string,
    {
      start: number;
      end: number;
      sourceNode: NodeWithData;
      targetNodeMap: Record<number, NodeWithData>;
    }
  > = {};

  const seen: Record<string, boolean> = {};
  const addDummyHandleIndex = (sourceNode: NodeWithData, sourceHandleIndex: number) => {
    if (!seen[sourceNode.id]) {
      seen[sourceNode.id] = true;
      sourceNode.data.renderArea.dummyHandleIndices = {};
    }
    sourceNode.data.renderArea.dummyHandleIndices[sourceHandleIndex] = true;
  };

  edges.forEach((edge) => {
    const sourceId = edge.source;
    const targetId = edge.target;
    const visibleSourceNode = renderMap[sourceId];
    const visibleTargetNode = renderMap[targetId];
    // sourceHandleIndex will be in ascending order because the output from genFlowNodes is ordered.
    const sourceHandleIndex = edge.data!.sourceHandleIndex;

    const { kvStart, kvEnd } = visibleSourceNode?.data?.renderArea ?? { kvStart: -1, kvEnd: -1 };
    const isDummySourceHandle = !(visibleSourceNode && kvStart <= sourceHandleIndex && sourceHandleIndex < kvEnd);

    // if both the target node and the source handle is in the viewport
    if (visibleTargetNode && !isDummySourceHandle) {
      return;
      // if the target node is in the viewport, but the source handle is not
    } else if (visibleTargetNode && isDummySourceHandle) {
      const sourceNode = visibleSourceNode ?? newDummySourceNode(nodeMap[sourceId]);
      addDummyHandleIndex(sourceNode, sourceHandleIndex);

      if (!visibleSourceNode) {
        renderMap[sourceNode.id] = sourceNode;
        nodes.push(sourceNode);
      }
      // if the source handle is in the viewport, but the target node is not
    } else if (!visibleTargetNode && !isDummySourceHandle) {
      const dummyNode = newDummyTargetNode(edge);
      renderMap[dummyNode.id] = dummyNode;
      nodes.push(dummyNode);
      // if neither the target node nor the source handle is in the viewport
    } else if (!visibleTargetNode && isDummySourceHandle) {
      const dummy = dummyMap[sourceId] ?? {
        start: -1,
        end: -1,
        sourceNode: visibleSourceNode ?? newDummySourceNode(nodeMap[sourceId]),
        targetNodeMap: {},
      };

      if (dummy.start < 0) {
        dummy.start = sourceHandleIndex;
      }
      dummy.end = sourceHandleIndex + 1;
      dummy.targetNodeMap[sourceHandleIndex] = newDummyTargetNode(edge);
      dummyMap[sourceId] = dummy;
    }
  });

  // if neither the source handle nor the target node is in the viewport,
  // we can render only parts of the edges for better performance
  // since the user can't see the difference when there are too many edges.
  for (const sourceId in dummyMap) {
    const { start, end, sourceNode, targetNodeMap } = dummyMap[sourceId];
    let startIdx = start;
    let endIdx = end;

    if (start >= sourceNode.data.renderArea.kvEnd) {
      endIdx = Math.min(endIdx, startIdx + maxEdgesForDummy);
    } else {
      startIdx = Math.max(startIdx, endIdx - maxEdgesForDummy);
    }

    for (let i = startIdx; i < endIdx; i++) {
      const targetNode = targetNodeMap[i];
      addDummyHandleIndex(sourceNode, i);

      if (!renderMap[sourceNode.id]) {
        renderMap[sourceNode.id] = sourceNode;
        nodes.push(sourceNode);
      }
      if (!renderMap[targetNode.id]) {
        renderMap[targetNode.id] = targetNode;
        nodes.push(targetNode);
      }
    }
  }
}

function getRenderRect(viewport: Viewport, width: number, height: number): Rect {
  return {
    x: (-viewport.x - smoothPaddingGap) / viewport.zoom,
    y: (-viewport.y - smoothPaddingGap) / viewport.zoom,
    width: (width + 2 * smoothPaddingGap) / viewport.zoom,
    height: (height + 2 * smoothPaddingGap) / viewport.zoom,
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
      renderArea: {
        kvStart: -1,
        kvEnd: -1,
        dummyHandleIndices: {},
      },
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
      renderArea: {
        kvStart: -1,
        kvEnd: -1,
        dummyHandleIndices: {},
      },
    },
    deletable: false,
    draggable: false,
  };
}
