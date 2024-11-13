import {
  clearNodeSelected,
  computeRevealPosition,
  toggleNodeHidden,
  toggleNodeSelected,
  triggerFoldSiblings,
} from "@/lib/graph/actions";
import {
  computeSourceHandleOffset,
  genFlowNodes,
  globalStyle,
  Layouter,
  newGraph,
  initialViewport,
} from "@/lib/graph/layout";
import type { EdgeWithData, Graph, RevealPosition } from "@/lib/graph/types";
import computeVirtualGraph from "@/lib/graph/virtual";
import { lastKey } from "@/lib/idgen";
import { getRawValue, hasChildren, isIterable, isRoot, Tree } from "@/lib/parser";
import { genDomString } from "@/lib/table";
import { type FunctionKeys } from "@/lib/utils";
import { type Viewport } from "@xyflow/react";
import fuzzysort from "fuzzysort";
import { keyBy } from "lodash-es";
import { createStore } from "zustand/vanilla";
import { type SearchResult } from "./types";

export interface ViewState {
  tree: Tree;
  tableHTML: string;
  graph: Graph;
  graphWidth: number;
  graphHeight: number;
  graphViewport: Viewport;

  setTree: (tree: Tree) => void;
  createTable: () => string;
  createGraph: () => { graph: Graph; renderable: Graph };
  setGraphSize: (width?: number, height?: number) => { renderable: Graph; changed: boolean };
  setGraphViewport: (viewport: Viewport) => { renderable: Graph; changed: boolean };
  search: (input: string) => SearchResult[];
}

const initialStates: Omit<ViewState, FunctionKeys<ViewState>> = {
  tree: new Tree(),
  tableHTML: "",
  graph: newGraph(),
  graphWidth: 0,
  graphHeight: 0,
  graphViewport: { x: globalStyle.nodeGap, y: globalStyle.nodeGap, zoom: 1 },
};

const useViewStore = createStore<ViewState>((set, get) => ({
  ...initialStates,

  setTree(tree: Tree) {
    const version = get().tree.version ?? 0;
    tree.version = version + 1;
    set({ tree });
  },

  // 5MB costs 230ms
  createTable() {
    const { tree } = get();
    const tableHTML = genDomString(tree);
    set({ tableHTML });
    return tableHTML;
  },

  // 5MB costs 260ms
  createGraph() {
    const {
      tree,
      graphWidth,
      graphHeight,
      graphViewport: { zoom },
    } = get();
    // reset viewport
    const graphViewport = { ...initialViewport, zoom };

    if (!tree.valid()) {
      set({ graph: newGraph(), graphViewport });
      return { graph: newGraph(), renderable: newGraph() };
    }

    // TODO: genFlowNodes is slow, need optimization
    const { nodes, edges } = genFlowNodes(tree);
    const { ordered, levelMeta } = new Layouter(tree, nodes, edges).layout();
    const nodeMap = keyBy(ordered, "id");
    const edgeMap: Record<string, EdgeWithData> = {};

    edges.forEach((ed) => {
      const source = nodeMap[ed.source];
      const target = nodeMap[ed.target];
      ed.data!.start = {
        x: source.position.x + source.data.width,
        y: source.position.y + computeSourceHandleOffset(ed.data!.sourceHandleIndex),
      };
      ed.data!.end = {
        x: target.position.x,
        y: target.position.y + ed.data!.targetHandleOffset,
      };
      edgeMap[ed.id] = ed;
    });

    const graph = { nodes: ordered, edges, levelMeta, nodeMap, edgeMap };
    const { renderable } = computeVirtualGraph(graph, graphWidth, graphHeight, graphViewport);
    set({ graph, graphViewport });
    return { graph, renderable };
  },

  setGraphSize(width?: number, height?: number) {
    const { graph, graphWidth, graphHeight, graphViewport } = get();
    const { renderable, changed } = computeVirtualGraph(
      graph,
      width ?? graphWidth,
      height ?? graphHeight,
      graphViewport,
    );
    set({ graph, graphWidth: width, graphHeight: height });
    return { renderable, changed };
  },

  setGraphViewport(viewport: Viewport) {
    const { graph, graphWidth, graphHeight } = get();
    const { renderable, changed } = computeVirtualGraph(graph, graphWidth, graphHeight, viewport);
    set({ graph, graphViewport: viewport });
    return { renderable, changed };
  },

  search(input: string) {
    const { tree } = get();
    const nodes = Object.values(tree.nodeMap);

    const keysResults = fuzzysort.go(input, nodes, {
      keys: [(node) => lastKey(node.id), (node) => (!isIterable(node) && getRawValue(node)) || ""],
    });

    const results: SearchResult[] = keysResults.map((r) => {
      const node = r.obj;
      const isMatchValue = r[0].score <= r[1].score;
      const revealType = (isRoot(node) && "node") || (isMatchValue && "value") || (hasChildren(node) ? "node" : "key");

      return {
        revealType,
        id: node.id,
        label: isMatchValue ? (getRawValue(node) ?? "") : lastKey(node.id),
      };
    });

    return results;
  },
}));

export const getViewState = useViewStore.getState;

export function createTable() {
  return getViewState().createTable();
}

export function createGraph() {
  return getViewState().createGraph();
}

export function setGraphSize(width?: number, height?: number) {
  return getViewState().setGraphSize(width, height);
}

export function setGraphViewport(viewport: Viewport) {
  return getViewState().setGraphViewport(viewport);
}

export function toggleGraphNodeHidden(nodeId: string, handleId?: string, hide?: boolean) {
  return toggleNodeHidden(getViewState().graph, nodeId, handleId, hide);
}

export function toggleGraphNodeSelected(nodeId: string) {
  return toggleNodeSelected(getViewState().graph, nodeId);
}

export function clearGraphNodeSelected() {
  return clearNodeSelected(getViewState().graph);
}

export function triggerGraphFoldSiblings(nodeId: string, fold: boolean) {
  return triggerFoldSiblings(getViewState().graph, nodeId, fold);
}

export function computeGraphRevealPosition(revealPosition: RevealPosition) {
  const { tree, graph, graphWidth, graphHeight } = getViewState();
  return computeRevealPosition(graphWidth, graphHeight, graph, tree, revealPosition);
}

export function searchInView(input: string) {
  const { search } = getViewState();
  return search(input);
}
