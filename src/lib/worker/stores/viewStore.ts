import {
  clearNodeSelected,
  computeRevealPosition,
  toggleNodeHidden,
  toggleNodeSelected,
  triggerFoldSiblings,
} from "@/lib/graph/actions";
import { computeSourceHandleOffset, genFlowNodes, Layouter } from "@/lib/graph/layout";
import { globalStyle, initialViewport } from "@/lib/graph/style";
import type { EdgeWithData, Graph, NodeWithData, RevealPosition, SubGraph } from "@/lib/graph/types";
import { getGraphNodeId, newGraph, newSubGraph } from "@/lib/graph/utils";
import computeVirtualGraph from "@/lib/graph/virtual";
import { type GraphNodeId, isDescendant, lastKey } from "@/lib/idgen";
import { getRawValue, hasChildren, isIterable, isRoot, Tree } from "@/lib/parser";
import { buildTableGrid } from "@/lib/table/builder";
import type { TableGrid } from "@/lib/table/types";
import { newTableGrid } from "@/lib/table/utils";
import type { FunctionKeys } from "@/lib/utils";
import type { Viewport } from "@xyflow/react";
import fuzzysort from "fuzzysort";
import { keyBy } from "lodash-es";
import { createStore } from "zustand/vanilla";
import type { SearchResult } from "./types";

// NOTICE: Only exists and is used in web workers
export interface ViewState {
  tree: Tree;
  table: TableGrid;
  graph: Graph;
  graphWidth: number;
  graphHeight: number;
  graphViewport: Viewport;

  setTree: (tree: Tree) => void;
  createTable: () => TableGrid;
  createGraph: (needResetViewport: boolean) => { graph: Graph; renderable: SubGraph; viewport: Viewport };
  setGraphSize: (width?: number, height?: number) => { renderable: SubGraph; changed: boolean };
  setGraphViewport: (viewport: Viewport) => { renderable: SubGraph; changed: boolean };
  setGraphRevealPosition: (
    pos: RevealPosition,
    zoom: number,
  ) => { renderable: SubGraph; selected?: NodeWithData; center: Viewport; changed: boolean } | undefined;
  setTableRevealPosition: (pos: RevealPosition) => { row: number; col: number } | undefined;
  search: (input: string) => SearchResult[];
}

const initialStates: Omit<ViewState, FunctionKeys<ViewState>> = {
  tree: new Tree(),
  table: newTableGrid(),
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

  // 5MB costs 410ms
  createTable() {
    const { tree } = get();
    const table = buildTableGrid(tree);
    set({ table });
    return table;
  },

  // 5MB costs 260ms
  createGraph(needResetViewport: boolean) {
    const { tree, graphWidth, graphHeight, graphViewport: oldViewport } = get();
    const newViewport = { ...initialViewport, zoom: oldViewport.zoom };

    if (!tree.valid()) {
      set({ graph: newGraph(), graphViewport: newViewport });
      return { graph: newGraph(), renderable: newSubGraph(), viewport: newViewport };
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

    const graphViewport = needResetViewport ? newViewport : oldViewport;
    const graph = newGraph({ nodes: ordered, edges, levelMeta, nodeMap, edgeMap });
    const { renderable } = computeVirtualGraph(graph, graphWidth, graphHeight, graphViewport);
    set({ graph, graphViewport });
    return { graph, renderable, viewport: graphViewport };
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
    return { graph, renderable, changed };
  },

  setGraphRevealPosition(pos: RevealPosition, zoom: number) {
    const { tree, graph, graphWidth, graphHeight } = getViewState();
    const { treeNodeId, target } = pos;
    const graphNodeId = getGraphNodeId(treeNodeId, target);

    const r = computeRevealPosition(graphWidth, graphHeight, graph, tree, pos);
    if (!r) {
      return;
    }

    const { selected } = toggleNodeSelected(graph, graphNodeId, treeNodeId);

    const viewport = { ...r.viewport, zoom };
    const { renderable, changed } = computeVirtualGraph(graph, graphWidth, graphHeight, viewport);

    set({ graph, graphViewport: viewport });
    return { renderable, selected, center: { ...r.center, zoom }, changed };
  },

  setTableRevealPosition(pos: RevealPosition) {
    const { table } = get();
    const { treeNodeId, target } = pos;
    const match = table.posMap!.get(treeNodeId);

    if (match) {
      let p = match.find((p) => p.type === target);
      if (!p) {
        p = match[match.length - 1];
      }
      return { row: p.row, col: p.col };
    }

    for (const [id, pp] of table.posMap!) {
      if (isDescendant(treeNodeId, id)) {
        const p = pp[pp.length - 1];
        return { row: p.row, col: p.col };
      }
    }

    return;
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
      const revealTarget =
        (isRoot(node) && "graphNode") || (isMatchValue && "value") || (hasChildren(node) ? "graphNode" : "key");

      return {
        revealTarget,
        id: node.id,
        label: isMatchValue ? (getRawValue(node) ?? "") : lastKey(node.id),
      };
    });

    return results;
  },
}));

export const getViewState = useViewStore.getState;

export function createTable() {
  const table = getViewState().createTable();
  return { ...table, posMap: undefined };
}

export function createGraph(needResetViewport: boolean) {
  return getViewState().createGraph(needResetViewport);
}

export function setGraphSize(width?: number, height?: number) {
  return getViewState().setGraphSize(width, height);
}

export function setGraphViewport(viewport: Viewport) {
  return getViewState().setGraphViewport(viewport);
}

export function setGraphRevealPosition(pos: RevealPosition, zoom: number) {
  return getViewState().setGraphRevealPosition(pos, zoom);
}

export function setTableRevealPosition(pos: RevealPosition) {
  return getViewState().setTableRevealPosition(pos);
}

export function toggleGraphNodeHidden(nodeId: GraphNodeId, handleId?: string, hide?: boolean) {
  return toggleNodeHidden(getViewState().graph, nodeId, handleId, hide);
}

export function toggleGraphNodeSelected(nodeId?: GraphNodeId, selectedKvId?: string) {
  return toggleNodeSelected(getViewState().graph, nodeId, selectedKvId);
}

export function clearGraphNodeSelected() {
  return clearNodeSelected(getViewState().graph);
}

export function triggerGraphFoldSiblings(nodeId: GraphNodeId, fold: boolean) {
  return triggerFoldSiblings(getViewState().graph, nodeId, fold);
}

export function searchInView(input: string) {
  const { search } = getViewState();
  return search(input);
}
