import { getParentId, type GraphNodeId, join as idJoin, isChild, isDescendant, splitParentPointer } from "@/lib/idgen";
import { type Tree } from "@/lib/parser";
import { type XYPosition } from "@xyflow/react";
import { computeSourceHandleOffset } from "./layout";
import type { RevealPosition, Graph, SubGraph, NodeWithData } from "./types";
import {
  getAncestor,
  getDescendant,
  getGraphNodeId,
  highlightEdge,
  highlightNode,
  matchApply,
  newSubGraph,
  toggleHidden,
  toggleToolbar,
} from "./utils";
import { generateVirtualGraph } from "./virtual";

/**
 * Toggles the hidden state of a node and its descendants.
 * @param graph - The graph.
 * @param nodeId - The ID of the node to toggle.
 * @param handleId - The ID of the handle to toggle.
 * @param hide - Whether to hide the node.
 * @returns The updated graph.
 */
export function toggleNodeHidden(graph: Graph, nodeId: GraphNodeId, handleId?: string, hide?: boolean) {
  const prefixId = handleId !== undefined ? idJoin(nodeId, handleId) : undefined;
  const { nodes: descendantNodes, edges: descendantEdges } = getDescendant(graph, nodeId, prefixId);
  const isHide = hide ?? !(descendantNodes[0]?.hidden ?? false);

  matchApply(graph.nodes, descendantNodes, (nd) => toggleHidden(nd, isHide));
  matchApply(graph.edges, descendantEdges, (ed) => toggleHidden(ed, isHide));
  return generateVirtualGraph(graph);
}

/**
 * Toggles the selected state of a node and its ancestors and descendants.
 * @param graph - The graph.
 * @param id - The ID of the node to toggle.
 * @param selectedKvId - The ID of the selected key-value pair.
 * @returns The visible subgraph after update.
 */
export function toggleNodeSelected(
  graph: Graph,
  id?: GraphNodeId,
  selectedKvId?: string,
): SubGraph & { selected?: NodeWithData } {
  if (!id) {
    return newSubGraph(graph);
  }

  const node = graph.nodeMap?.[id]!;
  const { nodes: ancestorNodes, edges: ancestorEdges } = getAncestor(graph, id);
  const { nodes: descendantNodes, edges: descendantEdges } = getDescendant(graph, id);
  const selectedId = selectedKvId ?? id;

  const isNeedHighlight = (nodeIdOrEdgeId: string) =>
    nodeIdOrEdgeId == selectedId || isDescendant(nodeIdOrEdgeId, id) || isChild(selectedId, nodeIdOrEdgeId);

  matchApply(
    graph.edges,
    [...ancestorEdges, ...descendantEdges],
    (ed) => highlightEdge(ed, isNeedHighlight(ed.id)),
    (ed) => highlightEdge(ed, false),
  );
  matchApply(
    graph.nodes,
    [node, ...ancestorNodes, ...descendantNodes],
    (nd) => toggleToolbar(highlightNode(nd, isNeedHighlight(nd.id), nd.id === id), node),
    (nd) => toggleToolbar(highlightNode(nd, false), node),
  );

  if (selectedKvId) {
    node.data.selectedKvId = selectedKvId;
  }

  ancestorEdges.forEach((ed) => {
    const nd = graph.nodeMap?.[ed.source]!;
    nd.data.selectedKvId = ed.target;
  });

  return { ...generateVirtualGraph(graph), selected: node };
}

/**
 * Clears the selected state of all nodes.
 * @param graph - The graph.
 * @returns The updated graph.
 */
export function clearNodeSelected(graph: Graph) {
  graph.edges.forEach((ed) => highlightEdge(ed, false));
  graph.nodes.forEach((nd) => toggleToolbar(highlightNode(nd, false), undefined));
  return generateVirtualGraph(graph);
}

/**
 * Triggers the folding of siblings of a node.
 * @param graph - The graph.
 * @param nodeId - The ID of the node.
 * @param fold - Whether to fold the siblings.
 * @returns The updated graph.
 */
export function triggerFoldSiblings(graph: Graph, nodeId: GraphNodeId, fold: boolean) {
  const parentId = getParentId(nodeId);

  if (parentId) {
    const isSiblingOrDescendantOfSibling = (id: string) =>
      id.startsWith(parentId) && !(parentId === id || isDescendant(nodeId, id));

    matchApply(
      graph.edges,
      graph.edges.filter((ed) => isSiblingOrDescendantOfSibling(ed.target)),
      (ed) => toggleHidden(ed, fold),
    );
    matchApply(
      graph.nodes,
      graph.nodes.filter((nd) => isSiblingOrDescendantOfSibling(nd.id)),
      (nd) => toggleHidden(nd, fold),
    );
  }

  return generateVirtualGraph(graph);
}

/**
 * Computes the reveal position of a node.
 * @param width - The width of the viewport.
 * @param height - The height of the viewport.
 * @param graph - The graph.
 * @param tree - The tree.
 * @param revealPosition - The reveal position.
 * @returns The center and viewport position.
 */
export function computeRevealPosition(
  width: number,
  height: number,
  graph: Graph,
  tree: Tree,
  { target, treeNodeId }: RevealPosition,
):
  | {
      center: XYPosition;
      viewport: XYPosition;
    }
  | undefined {
  const { parent, lastKey } = splitParentPointer(treeNodeId);
  const graphNodeId = getGraphNodeId(treeNodeId, target);
  const graphNode = graph.nodeMap?.[graphNodeId];

  if (!graphNode) {
    console.error("computeRevealPosition (node not found):", treeNodeId, target, graphNodeId, graph);
    return;
  }

  let xOffset = 0;
  let yOffset = 0;

  if (target !== "graphNode") {
    const i = tree.node(parent!).childrenKeys?.indexOf(lastKey) ?? 0;
    yOffset = computeSourceHandleOffset(i);
    xOffset = target === "key" ? 0 : graphNode.data.width / 2;
  }

  // must >= Toolbar's height, otherwise Toolbar of the graph node will not in viewport
  const gap = 25;
  const x = graphNode.position.x + Math.min(graphNode.data.width / 2, width / 2 - gap) + xOffset;
  const y = graphNode.position.y + Math.min(graphNode.data.height / 2, height / 2 - gap) + yOffset;
  return {
    center: { x, y },
    viewport: { x: x - width / 2, y: y - height / 2 },
  };
}
