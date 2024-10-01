import { type Kind } from "@/lib/editor/editor";
import type { Graph } from "@/lib/graph/layout";
import { Tree } from "@/lib/parser";
import { type KeyWithType } from "@/lib/table";
import { type FunctionKeys } from "@/lib/utils";
import { create } from "zustand";

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
  visibleGraph: Graph;
  tooltipContent?: TooltipContent;

  setTree: (tree: Tree, kind: Kind) => void;
  setVisibleGraph: (graph: Graph) => void;
  setTooltip: (content: TooltipContent) => void;
  hideTooltip: () => void;
}

const initialStates: Omit<TreeState, FunctionKeys<TreeState>> = {
  main: new Tree(),
  secondary: new Tree(),
  visibleGraph: { nodes: [], edges: [] },
};

export const useTreeStore = create<TreeState>()((set, get) => ({
  ...initialStates,

  setTree(tree: Tree, kind: Kind) {
    set({ [kind]: tree });
  },

  setVisibleGraph(graph: Graph) {
    set({ visibleGraph: graph });
  },

  setTooltip(content: TooltipContent) {
    set({ tooltipContent: content });
  },

  hideTooltip() {
    set({ tooltipContent: initialStates.tooltipContent });
  },
}));

export function useTree(kind: Kind = "main") {
  return useTreeStore((state) => state[kind]);
}

export function useTreeVersion() {
  return useTreeStore((state) => state.main.version ?? 0);
}

export function getTreeState() {
  return useTreeStore.getState();
}
