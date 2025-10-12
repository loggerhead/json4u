import { globalStyle } from "@/lib/graph/style";
import type { NodeWithData, GraphVirtual, Graph, EdgeWithData, SubGraph } from "@/lib/graph/types";
import { type Viewport, type Rect } from "@xyflow/react";
import { getOverlappingArea } from "@xyflow/system";
import { filter } from "lodash-es";
import { newSubGraph } from "./utils";

export const refreshInterval = 30;
const smoothPaddingGap = 200;
// When the number of nodes is small, we can skip the computation for a smoother user experience.
const minVirtualizeNodeNum = 100;
const maxVirtualEdgesForTwoNodes = 10;

/**
 * Computes the visible subgraph of a large graph based on the current viewport.
 * @param graph - The full graph data.
 * @param width - The width of the viewport.
 * @param height - The height of the viewport.
 * @param viewport - The current viewport position and zoom level. The x,y values here are coordinates of the left-top point,
 *                   which is different from what it means in xyflow where it represents transform.
 *                   See https://github.com/xyflow/xyflow/discussions/4311#discussioncomment-9602692
 * @returns An object containing the renderable subgraph and a boolean indicating if it changed.
 */
export default function computeVirtualGraph(
  graph: Graph,
  width: number,
  height: number,
  viewport: Viewport,
): { renderable: SubGraph; changed: boolean } {
  if (graph.nodes.length <= minVirtualizeNodeNum) {
    return { renderable: newSubGraph(graph), changed: false };
  }

  if (width <= 0 || height <= 0 || viewport.zoom <= 0) {
    console.error("invalid viewport", width, height, viewport);

    width = 1000;
    height = 1000;
    viewport = { ...viewport, zoom: 1 };
  }

  const oldRenderMeta = graph.virtual;
  const viewportRect = getRenderRect(viewport, width, height);

  const { virtual, nodes } = computeRealSubgraph(viewportRect, graph);
  let changed = computeRealKV(viewportRect, nodes);
  graph.virtual = virtual;

  virtualize(graph);
  const renderable = generateVirtualGraph(graph);
  changed = changed || isSubgraphChanged(oldRenderMeta, graph.virtual);

  return { renderable, changed };
}

/**
 * Computes the real subgraph, which consists of nodes and edges that are currently visible in the viewport.
 * @param viewportRect - The rectangle representing the current viewport.
 * @param graph - The full graph data.
 * @returns The visible subgraph with virtual metadata containing visibility flags and virtual node information.
 */
function computeRealSubgraph(viewportRect: Rect, graph: Graph): SubGraph & { virtual: GraphVirtual } {
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

  const virtual = {
    realNodeIds,
    realEdgeIds,
    omitEdgeIds: {},
    virtualSourceNodeIds: {},
    virtualTargetNodeIds: {},
  };

  return { ...newSubGraph({ nodes, edges }), virtual };
}

/**
 * Since a node may be at the edge of the viewport, not all of its key-value pairs need to be displayed.
 * So we can compute the visible properties (key-value pairs) for each visible node as rendering key-value pairs affects performance.
 * @param viewportRect - The rectangle representing the current viewport.
 * @param nodes - The array of visible nodes.
 * @returns A boolean indicating whether the visible properties have changed.
 */
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

/**
 * Determines which nodes and edges should be virtualized based on viewport visibility.
 * It identifies nodes that are off-screen but connected to on-screen elements.
 * @param graph - The graph data, which will be mutated with virtualization info.
 */
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

    if (!realSourceNode && isVirtualSourceHandle) {
      virtualSourceNodeIds![sourceId] = true;
    }

    // Case 1: Both the target node and the source handle are in the viewport.
    if (realTargetNode && !isVirtualSourceHandle) {
      return;
      // Case 2: The target node is in the viewport, but the source handle is not.
    } else if (realTargetNode && isVirtualSourceHandle) {
      const sourceNode = realSourceNode ?? nodeMap[sourceId];
      sourceNode.data.render.virtualHandleIndices[sourceHandleIndex] = true;
      // Case 3: The source handle is in the viewport, but the target node is not.
    } else if (!realTargetNode && !isVirtualSourceHandle) {
      virtualTargetNodeIds![targetId] = true;
      // Case 4: Neither the target node nor the source handle is in the viewport.
    } else if (!realTargetNode && isVirtualSourceHandle) {
      if (!virtualMap[sourceId]) {
        virtualMap[sourceId] = [];
      }

      virtualMap[sourceId].push({ id: targetId, index: sourceHandleIndex });
    }
  });

  // If neither the source handle nor the target node is in the viewport,
  // we can render only a subset of the edges for better performance,
  // as the user can't see the difference when there are too many edges.
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

function getRenderRect({ x, y, zoom }: Viewport, width: number, height: number): Rect {
  return {
    x: (x - smoothPaddingGap) / zoom,
    y: (y - smoothPaddingGap) / zoom,
    width: (width + 2 * smoothPaddingGap) / zoom,
    height: (height + 2 * smoothPaddingGap) / zoom,
  };
}

function isSubgraphChanged(oldVirtual: GraphVirtual | undefined, newVirtual: GraphVirtual | undefined) {
  const isEq = (field: keyof GraphVirtual) => {
    const a = new Set(Object.keys(oldVirtual?.[field] ?? {}));
    const b = new Set(Object.keys(newVirtual?.[field] ?? {}));
    return a.size === b.size && a.size === a.intersection(b).size;
  };

  return (
    !!oldVirtual !== !!newVirtual ||
    !(
      isEq("realNodeIds") &&
      isEq("realEdgeIds") &&
      isEq("omitEdgeIds") &&
      isEq("virtualSourceNodeIds") &&
      isEq("virtualTargetNodeIds")
    )
  );
}

/**
 * Generates the final renderable graph, including real nodes and virtual nodes used as placeholders.
 * @param graph - The full graph with virtualization metadata.
 * @returns The renderable graph containing only the elements to be displayed.
 */
export function generateVirtualGraph(graph: Graph): SubGraph {
  if (!graph.virtual) {
    return newSubGraph(graph);
  }

  const { realNodeIds, realEdgeIds, omitEdgeIds, virtualSourceNodeIds, virtualTargetNodeIds } = graph.virtual;
  const nodes = Object.keys(realNodeIds)
    .map((id) => graph.nodeMap![id])
    .concat(Object.keys(virtualSourceNodeIds ?? {}).map((id) => newVirtualSourceNode(graph.nodeMap![id])))
    .concat(Object.keys(virtualTargetNodeIds ?? {}).map((id) => newVirtualTargetNode(graph.nodeMap![id])));
  const edges =
    (filter(Object.keys(realEdgeIds).map((id) => !omitEdgeIds?.[id] && graph.edgeMap![id])) as EdgeWithData[]) ?? [];

  return newSubGraph({ nodes, edges });
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
      kvWidthMap: {},
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
      kvWidthMap: {},
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
