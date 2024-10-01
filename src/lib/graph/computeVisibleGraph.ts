import { newGraph, type NodeWithData, type Graph, EdgeWithData } from "@/lib/graph/layout";
import { genDummyId } from "@/lib/idgen";
import { XYPosition, type Viewport } from "@xyflow/react";
import { getOverlappingArea, type Rect } from "@xyflow/system";
import { differenceWith, isEmpty, keyBy } from "lodash-es";

// TODO: add to viewportRect
const smoothPaddingGap = 500;

export default function computeVisibleGraph(
  oldVisible: Graph,
  graph: Graph,
  width: number,
  height: number,
  viewport: Viewport,
): { visible: Graph; changed: boolean } {
  if (width <= 0 || height <= 0 || viewport.zoom <= 0) {
    console.error("invalid viewport", width, height, viewport);
    return { visible: newGraph(), changed: true };
  }

  const viewportRect = {
    x: -viewport.x / viewport.zoom,
    y: -viewport.y / viewport.zoom,
    width: width / viewport.zoom,
    height: height / viewport.zoom,
  };
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
  const nodeMap = keyBy(nodes, "id");
  const edges = graph.edges.filter(isEdgeInViewport).map((edge) => {
    if (nodeMap[edge.source] && nodeMap[edge.target]) {
      return edge;
    }

    const dummyEdge = { ...edge };

    if (!nodeMap[edge.source]) {
      const dummyNode = newDummyNode(edge.data!.start, edge.source, edge.sourceHandle!);
      nodes.push(dummyNode);
      dummyEdge.source = dummyNode.id;
      dummyEdge.sourceHandle = undefined;
    }
    if (!nodeMap[edge.target]) {
      const dummyNode = newDummyNode(edge.data!.end, edge.target);
      nodes.push(dummyNode);
      dummyEdge.target = dummyNode.id;
    }

    return dummyEdge;
  });

  const visible = { nodes, edges };
  return { visible, changed: isVisibleChanged(oldVisible, visible) };
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

function newDummyNode(position: XYPosition, id: string, childKey?: string): NodeWithData {
  return {
    id: genDummyId(id, childKey),
    position,
    type: childKey !== undefined ? "dummySource" : "dummyTarget",
    data: {
      level: 0,
      depth: 0,
      width: 0,
      height: 0,
      parentId: "",
      childrenIds: [],
    },
    deletable: false,
    draggable: false,
  };
}
