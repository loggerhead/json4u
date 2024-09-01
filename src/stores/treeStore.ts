import type { Kind } from "@/lib/editor/editor";
import type { Graph } from "@/lib/graph/layout";
import { Tree } from "@/lib/parser";
import type { KeyWithType } from "@/lib/table";
import { type FunctionKeys } from "@/lib/utils";
import { create } from "zustand";
import { useShallow } from "zustand/react/shallow";
import { createContext } from "./context";
import { getStore } from "./utils";

export const sides = ["top", "bottom", "left", "right"];
export type Side = (typeof sides)[number];

export interface TooltipPosition {
  left: number;
  top: number;
  side: Side;
}

interface TooltipContent {
  targetId: string;
  path: KeyWithType[];
  computePosition: (
    table: HTMLElement | null,
    target: HTMLElement | null,
    tooltip: HTMLElement | null,
  ) => TooltipPosition | undefined;
}

export interface TreeState {
  main: Tree;
  secondary: Tree;
  graph: Graph;
  tableHTML: string;
  tooltipContent?: TooltipContent;

  setTree: (tree: Tree, kind: Kind) => void;
  setTableHTML: (tableHTML?: string) => void;
  setTooltip: (content: TooltipContent) => void;
  hideTooltip: () => void;
  setGraph: (graph?: Graph) => void;
}

const initialStates: Omit<TreeState, FunctionKeys<TreeState>> = {
  main: new Tree(),
  secondary: new Tree(),
  graph: { nodes: [], edges: [] },
  tableHTML: "",
};

export const {
  Provider: TreeStoreProvider,
  useStoreCtx: useTreeStoreCtx,
  useStore: useTreeStore,
} = createContext("treeStore", () =>
  create<TreeState>()((set, get) => ({
    ...initialStates,

    setTree(tree: Tree, kind: Kind) {
      set({ [kind]: tree });
    },

    setTableHTML(tableHTML?: string) {
      set({ tableHTML: tableHTML ?? initialStates.tableHTML });
    },

    setTooltip(content: TooltipContent) {
      set({ tooltipContent: content });
    },

    hideTooltip() {
      set({ tooltipContent: initialStates.tooltipContent });
    },

    setGraph(graph?: Graph) {
      set({ graph: graph ?? initialStates.graph });
    },
  })),
);

export function useTree(kind: Kind = "main") {
  return useTreeStore((state) => state[kind]);
}

export function useTreeVersion() {
  return useTreeStore((state) => state.main.version ?? 0);
}

export function useGraph() {
  return useTreeStore(
    useShallow((state) => ({
      nodes: state.graph.nodes,
      edges: state.graph.edges,
      levelMeta: state.graph.levelMeta,
    })),
  );
}

export function getTreeState() {
  return getStore("treeStore").getState();
}
