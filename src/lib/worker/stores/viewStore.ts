import computeVisible from "@/lib/graph/computeVisible";
import {
  computeSourceHandleOffset,
  genFlowNodes,
  globalStyle,
  Layouter,
  newGraph,
  NodeWithData,
  type Graph,
} from "@/lib/graph/layout";
import { Tree } from "@/lib/parser";
import { genDomString } from "@/lib/table";
import { type FunctionKeys } from "@/lib/utils";
import { type Viewport } from "@xyflow/react";
import { keyBy } from "lodash-es";
import { createStore } from "zustand/vanilla";

export interface ViewState {
  tree: Tree;
  tableHTML: string;
  graph: Graph;
  visibleGraph: Graph;
  graphNodeMap: Record<string, NodeWithData>;
  graphWidth: number;
  graphHeight: number;
  graphViewport: Viewport;

  setTree: (tree: Tree) => void;
  createTable: () => string;
  createGraph: () => { visible: Graph };
  setGraphSize: (width?: number, height?: number) => { visible: Graph; changed: boolean };
  setGraphViewport: (viewport: Viewport) => { visible: Graph; changed: boolean };
}

const initialStates: Omit<ViewState, FunctionKeys<ViewState>> = {
  tree: new Tree(),
  tableHTML: "",
  graph: newGraph(),
  visibleGraph: newGraph(),
  graphNodeMap: {},
  graphWidth: 0,
  graphHeight: 0,
  graphViewport: { x: globalStyle.nodeGap, y: globalStyle.nodeGap, zoom: 1 },
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
    const { tree, visibleGraph, graphWidth, graphHeight, graphViewport } = get();

    if (!tree.valid()) {
      set({ graph: initialStates.graph, visibleGraph: initialStates.visibleGraph });
      return { graph: initialStates.graph, visible: initialStates.visibleGraph };
    }

    // TODO: slow
    const { nodes, edges } = genFlowNodes(tree);
    const { ordered, levelMeta } = new Layouter(tree, nodes, edges).layout();
    const graphNodeMap = keyBy(ordered, "id");

    edges.forEach((ed) => {
      const source = graphNodeMap[ed.source];
      const target = graphNodeMap[ed.target];
      ed.data!.start = {
        x: source.position.x + source.data.width,
        y: source.position.y + computeSourceHandleOffset(ed.data!.sourceHandleIndex),
      };
      ed.data!.end = {
        x: target.position.x,
        y: target.position.y + ed.data!.targetHandleOffset,
      };
    });

    const graph = { nodes: ordered, edges, levelMeta };
    const { visible } = computeVisible(visibleGraph, graph, graphNodeMap, graphWidth, graphHeight, graphViewport);

    set({ graph, visibleGraph: visible, graphNodeMap });
    return { visible };
  },

  setGraphSize(width?: number, height?: number) {
    const { graph, visibleGraph, graphNodeMap, graphWidth, graphHeight, graphViewport } = get();
    const { visible, changed } = computeVisible(
      visibleGraph,
      graph,
      graphNodeMap,
      width ?? graphWidth,
      height ?? graphHeight,
      graphViewport,
    );

    set({ visibleGraph: visible, graphWidth: width, graphHeight: height });
    return { visible, changed };
  },

  setGraphViewport(viewport: Viewport) {
    const { graph, visibleGraph, graphNodeMap, graphWidth, graphHeight, graphViewport } = get();

    if (viewport.x === graphViewport.x && viewport.y === graphViewport.y && viewport.zoom === graphViewport.zoom) {
      return { visible: visibleGraph, changed: false };
    }

    const { visible, changed } = computeVisible(visibleGraph, graph, graphNodeMap, graphWidth, graphHeight, viewport);

    set({ visibleGraph: visible, graphViewport: viewport });
    return { visible, changed };
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
