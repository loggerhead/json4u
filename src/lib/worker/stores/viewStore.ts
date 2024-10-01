import { genFlowNodes, Layouter, type Graph } from "@/lib/graph/layout";
import { Tree } from "@/lib/parser";
import { genDomString } from "@/lib/table";
import { type FunctionKeys } from "@/lib/utils";
import { type Viewport } from "@xyflow/react";
import { createStore } from "zustand/vanilla";

export interface ViewState {
  tree: Tree;
  tableHTML: string;
  graph: Graph;

  setTree: (tree: Tree) => void;
  createTable: () => string;
  createGraph: () => Graph;
  setGraphSize: (width?: number, height?: number) => void;
  setGraphViewport: (viewport: Viewport) => void;
}

const initialStates: Omit<ViewState, FunctionKeys<ViewState>> = {
  tree: new Tree(),
  graph: { nodes: [], edges: [] },
  tableHTML: "",
};

const useViewStore = createStore<ViewState>((set, get) => ({
  ...initialStates,

  setTree(tree: Tree) {
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
    const { tree } = get();
    const { nodes, edges } = genFlowNodes(tree);
    const { ordered, levelMeta } = new Layouter(tree, nodes, edges).layout();
    const graph = { nodes: ordered, edges, levelMeta };
    set({ graph });
    return graph;
  },

  // 1. get viewport (origin x, y in left-top)
  // 2. compute current bounds (real size) of viewport
  // 3. compute nodes includes in the bounds
  // 4. compute edges includes in the bounds
  // x/zoom, y/zoom 是实际大小
  setGraphSize(width?: number, height?: number) {
    const { graph } = get();
    set({ graph: { ...graph, width, height } });
  },

  setGraphViewport(viewport: Viewport) {
    const { graph } = get();
    set({ graph: { ...graph, viewport } });
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
