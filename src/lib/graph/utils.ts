import { edgeHighlightStyle, nodeHighlightStyle, nodeSelectedStyle } from "@/lib/graph/layout";
import type { EdgeWithData, Graph, NodeWithData } from "@/lib/graph/types";
import { getParentId } from "@/lib/idgen";
import { type Node as FlowNode, type Edge } from "@xyflow/react";
import { filter, keyBy } from "lodash-es";

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

export function highlightNode(node: NodeWithData, enable: boolean, isSelected?: boolean) {
  let style = undefined;

  if (enable) {
    style = isSelected ? nodeSelectedStyle : nodeHighlightStyle;
    node.data.selected = isSelected;
  } else {
    node.data.selected = undefined;
  }

  node.style = style;
  node.data.style = style;
  return node;
}

export function highlightEdge(edge: EdgeWithData, enable: boolean) {
  const style = enable ? edgeHighlightStyle : undefined;

  if (!edge.data) {
    (edge.data as any) = {};
  }

  edge.style = style;
  edge.data!.style = style;
  return edge;
}

export function toggleToolbar(node: NodeWithData, clicked: NodeWithData | undefined) {
  node.data.toolbarVisible = node.id === clicked?.id || undefined;
  return node;
}

export function toggleHidden<T extends FlowNode | Edge>(v: T, hide?: boolean) {
  v.hidden = hide;
  return v;
}

export function highlightElement(el: HTMLDivElement) {
  if (CSS.highlights) {
    const range = new Range();
    range.selectNode(el);
    CSS.highlights.set("search-highlight", new Highlight(range));
  } else {
    el.classList.add("search-highlight");
  }
}

export function clearHighlight() {
  if (CSS.highlights) {
    CSS.highlights.delete("search-highlight");
  } else {
    document.querySelectorAll(".search-highlight").forEach((el) => el.classList.remove("search-highlight"));
  }
}
