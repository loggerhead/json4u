import {
  clearNodeSelected,
  computeRevealPosition,
  toggleNodeHidden,
  toggleNodeSelected,
  triggerFoldSiblings,
} from "@/lib/graph/actions";
import {
  computeSourceHandleOffset,
  type EdgeWithData,
  genFlowNodes,
  globalStyle,
  Layouter,
  newGraph,
  type Graph,
  initialViewport,
} from "@/lib/graph/layout";
import computeVirtualGraph from "@/lib/graph/virtual";
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
  graphWidth: number;
  graphHeight: number;
  graphViewport: Viewport;

  setTree: (tree: Tree) => void;
  createTable: () => string;
  createGraph: () => { graph: Graph; renderable: Graph };
  setGraphSize: (width?: number, height?: number) => { renderable: Graph; changed: boolean };
  setGraphViewport: (viewport: Viewport) => { renderable: Graph; changed: boolean };
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

export function computeGraphRevealPosition(nodeId: string) {
  const { graph, graphWidth, graphHeight } = getViewState();
  return computeRevealPosition(graphWidth, graphHeight, graph, nodeId);
}
