import type { EdgeWithData, Graph, NodeWithData, RevealTarget, SubGraph } from "@/lib/graph/types";
import { getParentId, type GraphNodeId } from "@/lib/idgen";
import { type Node as FlowNode, type Edge } from "@xyflow/react";
import { filter, keyBy } from "lodash-es";
import { edgeHighlightStyle, nodeHighlightStyle, nodeSelectedStyle } from "./style";

// See the comment for type `GraphNodeId` for relation between `TreeNodeId` and `GraphNodeId`.
export function toGraphNodeId(treeNodeId: string): GraphNodeId {
  return treeNodeId as GraphNodeId;
}

export function getGraphNodeId(treeNodeId: string, target: RevealTarget) {
  const parentId = getParentId(treeNodeId);
  return toGraphNodeId(target === "graphNode" ? treeNodeId : (parentId ?? ""));
}

export function newGraph(g?: Omit<Graph, "__type">): Graph {
  return g ? { ...g, __type: "graph" } : { nodes: [], edges: [], __type: "graph" };
}

export function newSubGraph(g?: Omit<SubGraph, "__type">): SubGraph {
  return g ? { ...g, __type: "subGraph" } : { nodes: [], edges: [], __type: "subGraph" };
}

/**
 * Gets the descendants of a node.
 * @param graph - The graph.
 * @param nodeId - The ID of the node.
 * @param prefixId - The prefix ID of the descendants to get.
 * @returns The descendants of the node.
 */
export function getDescendant(graph: Graph, nodeId: string, prefixId?: string) {
  const nodes: NodeWithData[] = [];
  const edges: EdgeWithData[] = [];
  const getNode = (id: string) => graph.nodeMap?.[id];
  const getEdge = (id: string) => graph.edgeMap?.[id];

  const addTargetNodes = (targetNodes: NodeWithData[]) => {
    filter(targetNodes).forEach((nd) => nodes.push(nd));
    (filter(targetNodes.map((child) => getEdge(child?.id)) ?? []) as EdgeWithData[]).forEach((ed) => edges.push(ed));
  };

  let targetIds = getNode(nodeId)?.data?.targetIds ?? [];

  if (prefixId) {
    targetIds = targetIds.filter((id) => id === prefixId || getParentId(id) === prefixId);
  }

  addTargetNodes(targetIds.map(getNode) as NodeWithData[]);

  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i];
    addTargetNodes(node.data.targetIds.map(getNode) as NodeWithData[]);
  }

  return { nodes, edges };
}

/**
 * Gets the ancestors of a node.
 * @param graph - The graph.
 * @param nodeId - The ID of the node.
 * @returns The ancestors of the node.
 */
export function getAncestor(graph: Graph, nodeId: string) {
  const nodes: NodeWithData[] = [];
  const edges: EdgeWithData[] = [];
  const getNode = (id: string) => graph.nodeMap?.[id];
  const getEdge = (id: string) => graph.edgeMap?.[id];
  let node = getNode(nodeId);

  while (node?.data?.parentId) {
    const edge = getEdge(node.id);
    edge && edges.push(edge);

    const parent = getNode(node.data.parentId);
    if (!parent) {
      break;
    }

    nodes.push(parent);
    node = parent;
  }

  return { nodes, edges };
}

/**
 * Applies a function to a subset of an array.
 * @param all - The array to apply the pickFn or omitFn function to.
 * @param pick - The subset of the array to apply the pickFn function to.
 * @param pickFn - The function to apply to the pick subset.
 * @param omitFn - The function to apply to the rest of the array (all - pick).
 */
export function matchApply<T extends NodeWithData | EdgeWithData>(
  all: T[],
  pick: T[],
  pickFn: (v: T) => void,
  omitFn?: (v: T) => void,
) {
  if (!omitFn) {
    pick.forEach(pickFn);
    return;
  }

  const pickMap = keyBy(pick, "id");

  for (const item of all) {
    if (pickMap[item.id]) {
      pickFn(item);
    } else {
      omitFn(item);
    }
  }
}

/**
 * Highlights a node.
 * @param node - The node to highlight.
 * @param enable - Whether to highlight the node.
 * @param isSelected - Whether the node is selected.
 * @returns The highlighted node.
 */
export function highlightNode(node: NodeWithData, enable: boolean, isSelected?: boolean) {
  let style = undefined;

  if (enable) {
    style = isSelected ? nodeSelectedStyle : nodeHighlightStyle;
    node.data.selected = isSelected;
  } else {
    node.data.selected = undefined;
    node.data.selectedKvId = undefined;
  }

  node.style = style;
  node.data.style = style;
  return node;
}

/**
 * Highlights an edge.
 * @param edge - The edge to highlight.
 * @param enable - Whether to highlight the edge.
 * @returns The highlighted edge.
 */
export function highlightEdge(edge: EdgeWithData, enable: boolean) {
  const style = enable ? edgeHighlightStyle : undefined;

  if (!edge.data) {
    (edge.data as any) = {};
  }

  edge.style = style;
  edge.data!.style = style;
  return edge;
}

/**
 * Toggles the toolbar of a node.
 * @param node - The node to toggle the toolbar of.
 * @param clicked - The clicked node.
 * @returns The node with the toggled toolbar.
 */
export function toggleToolbar(node: NodeWithData, clicked: NodeWithData | undefined) {
  node.data.toolbarVisible = node.id === clicked?.id || undefined;
  return node;
}

/**
 * Toggles the hidden state of a node or edge.
 * @param v - The node or edge to toggle.
 * @param hide - Whether to hide the node or edge.
 * @returns The node or edge with the toggled hidden state.
 */
export function toggleHidden<T extends FlowNode | Edge>(v: T, hide?: boolean) {
  v.hidden = hide;
  return v;
}
