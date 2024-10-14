import {
  type NodeWithData,
  type Graph,
  type EdgeWithData,
  globalStyle,
  GraphVirtual,
  newGraph,
} from "@/lib/graph/layout";
import { type Viewport, type Rect } from "@xyflow/react";
import { getOverlappingArea } from "@xyflow/system";
import { filter } from "lodash-es";

export const refreshInterval = 30;
const smoothPaddingGap = 200;
// When the number of nodes is small, we can skip the computation for a smoother user experience.
const minVirtualizeNodeNum = 100;
const maxVirtualEdgesForTwoNodes = 10;

export default function computeVirtualGraph(
  graph: Graph,
  width: number,
  height: number,
  viewport: Viewport,
): { renderable: Graph; changed: boolean } {
  if (width <= 0 || height <= 0 || viewport.zoom <= 0) {
    console.error("invalid viewport", width, height, viewport);
    return { renderable: newGraph(), changed: graph.nodes.length > 0 };
  } else if (graph.nodes.length <= minVirtualizeNodeNum) {
    return { renderable: graph, changed: false };
  }

  const oldRenderMeta = graph.virtual;
  const viewportRect = getRenderRect(viewport, width, height);

  const { nodes } = computeRealSubgraph(viewportRect, graph);
  let changed = computeRealKV(viewportRect, nodes);

  virtualize(graph);

  const renderable = generateVirtualGraph(graph);
  changed = changed || isSubgraphChanged(oldRenderMeta, graph.virtual);
  return { renderable, changed };
}

function computeRealSubgraph(viewportRect: Rect, graph: Graph): Graph {
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

  const realNodeIds: Record<string, boolean> = {};
  const realEdgeIds: Record<string, boolean> = {};
  const nodes = graph.nodes.filter((nd) => {
    nd.data.render.virtualHandleIndices = {};
    return isNodeInViewport(nd);
  });
  const edges = graph.edges.filter(isEdgeInViewport);
  nodes.forEach((nd) => (realNodeIds[nd.id] = true));
  edges.forEach((ed) => (realEdgeIds[ed.id] = true));

  graph.virtual = {
    realNodeIds,
    realEdgeIds,
    omitEdgeIds: {},
    virtualSourceNodeIds: {},
    virtualTargetNodeIds: {},
  };
  return { nodes, edges };
}

function computeRealKV(viewportRect: Rect, nodes: NodeWithData[]) {
  let changed = false;

  nodes.forEach((node) => {
    const y = node.position.y;
    const h = node.data.height;
    const kvStart = Math.floor((Math.max(viewportRect.y, y) - y) / globalStyle.kvHeight);
    const kvEnd = Math.ceil((Math.min(viewportRect.y + viewportRect.height, y + h) - y) / globalStyle.kvHeight);

    const { kvStart: oldKvStart, kvEnd: oldKvEnd } = node.data.render;
    changed = changed || oldKvStart !== kvStart || oldKvEnd !== kvEnd;

    node.data.render = {
      kvStart,
      kvEnd,
      virtualHandleIndices: {},
    };
  });

  return changed;
}

function virtualize(graph: Graph) {
  // sourceId => { targetNodeId, virtualHandleIndex }
  const virtualMap: Record<string, { id: string; index: number }[]> = {};
  const { realNodeIds, realEdgeIds, omitEdgeIds, virtualSourceNodeIds, virtualTargetNodeIds } = graph.virtual!;
  const nodeMap = graph.nodeMap!;
  const edgeMap = graph.edgeMap!;

  Object.keys(realEdgeIds).forEach((edgeId) => {
    const { source: sourceId, target: targetId, data } = edgeMap[edgeId];
    const realSourceNode = realNodeIds[sourceId] ? nodeMap[sourceId] : null;
    const realTargetNode = realNodeIds[targetId] ? nodeMap[targetId] : null;
    const sourceHandleIndex = data!.sourceHandleIndex;

    const { kvStart, kvEnd } = realSourceNode?.data?.render ?? { kvStart: -1, kvEnd: -1 };
    const isVirtualSourceHandle = !(realSourceNode && kvStart <= sourceHandleIndex && sourceHandleIndex < kvEnd);

    // if both the target node and the source handle is in the viewport
    if (realTargetNode && !isVirtualSourceHandle) {
      return;
      // if the target node is in the viewport, but the source handle is not
    } else if (realTargetNode && isVirtualSourceHandle) {
      const sourceNode = realSourceNode ?? nodeMap[sourceId];

      if (!realSourceNode) {
        virtualSourceNodeIds![sourceId] = true;
      }

      sourceNode.data.render.virtualHandleIndices[sourceHandleIndex] = true;
      // if the source handle is in the viewport, but the target node is not
    } else if (!realTargetNode && !isVirtualSourceHandle) {
      virtualTargetNodeIds![targetId] = true;
      // if neither the target node nor the source handle is in the viewport
    } else if (!realTargetNode && isVirtualSourceHandle) {
      if (!virtualMap[sourceId]) {
        virtualMap[sourceId] = [];
      }

      virtualMap[sourceId].push({ id: targetId, index: sourceHandleIndex });
    }
  });

  // if neither the source handle nor the target node is in the viewport,
  // we can render only parts of the edges for better performance
  // since the user can't see the difference when there are too many edges.
  for (const sourceId in virtualMap) {
    const sourceNode = nodeMap[sourceId];
    const step = Math.ceil(virtualMap[sourceId].length / maxVirtualEdgesForTwoNodes);

    for (let i = 0; i < virtualMap[sourceId].length; i++) {
      const { id, index } = virtualMap[sourceId][i];
      const edge = edgeMap[id];

      if (step === 0 || i % step === 0) {
        sourceNode.data.render.virtualHandleIndices[index] = true;
        virtualTargetNodeIds![edge.target] = true;
      } else {
        omitEdgeIds![edge.id] = true;
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

function isSubgraphChanged(oldVirtual: GraphVirtual | undefined, newVirtual: GraphVirtual | undefined) {
  const isEq = (field: keyof GraphVirtual) => {
    const a = new Set(Object.keys(oldVirtual?.[field] ?? {}));
    const b = new Set(Object.keys(newVirtual?.[field] ?? {}));
    return a.size === b.size && a.size === a.intersection(b).size;
  };

  return !(
    isEq("realNodeIds") &&
    isEq("realEdgeIds") &&
    isEq("omitEdgeIds") &&
    isEq("virtualSourceNodeIds") &&
    isEq("virtualTargetNodeIds")
  );
}

export function generateVirtualGraph(graph: Graph): Graph {
  if (!graph.virtual) {
    return graph;
  }

  const { realNodeIds, realEdgeIds, omitEdgeIds, virtualSourceNodeIds, virtualTargetNodeIds } = graph.virtual;
  const nodes = Object.keys(realNodeIds)
    .map((id) => graph.nodeMap![id])
    .concat(Object.keys(virtualSourceNodeIds ?? {}).map((id) => newVirtualSourceNode(graph.nodeMap![id])))
    .concat(Object.keys(virtualTargetNodeIds ?? {}).map((id) => newVirtualTargetNode(graph.nodeMap![id])));
  const edges =
    (filter(Object.keys(realEdgeIds).map((id) => !omitEdgeIds?.[id] && graph.edgeMap![id])) as EdgeWithData[]) ?? [];

  return { nodes, edges };
}

function newVirtualSourceNode(node: NodeWithData): NodeWithData {
  return {
    id: node.id,
    position: node.position,
    type: node.type,
    hidden: node.hidden,
    data: {
      level: 0,
      depth: 0,
      width: node.data.width,
      height: node.data.height,
      parentId: "",
      targetIds: [],
      render: {
        kvStart: -1,
        kvEnd: -1,
        virtualHandleIndices: { ...node.data.render.virtualHandleIndices },
      },
    },
    deletable: false,
    draggable: false,
  };
}

function newVirtualTargetNode(node: NodeWithData): NodeWithData {
  return {
    id: node.id,
    position: {
      x: node.position.x,
      y: node.position.y + node.data.height / 2,
    },
    type: "virtualTarget",
    hidden: node.hidden,
    data: {
      level: 0,
      depth: 0,
      width: 1,
      height: 1,
      parentId: "",
      targetIds: [],
      render: {
        kvStart: -1,
        kvEnd: -1,
        virtualHandleIndices: {},
      },
    },
    deletable: false,
    draggable: false,
  };
}
