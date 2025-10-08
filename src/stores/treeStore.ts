import { type Kind } from "@/lib/editor/editor";
import { Tree } from "@/lib/parser";
import { type KeyWithType } from "@/lib/table";
import { type FunctionKeys } from "@/lib/utils";
import { create } from "zustand";
import { useShallow } from "zustand/shallow";

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
  tooltipContent?: TooltipContent;

  setTree: (tree: Tree, kind: Kind) => void;
  setTooltip: (content: TooltipContent) => void;
  hideTooltip: () => void;
}

const initialStates: Omit<TreeState, FunctionKeys<TreeState>> = {
  main: new Tree(),
  secondary: new Tree(),
};

export const useTreeStore = create<TreeState>()((set, get) => ({
  ...initialStates,

  setTree(tree: Tree, kind: Kind) {
    set({ [kind]: tree });
  },

  setTooltip(content: TooltipContent) {
    set({ tooltipContent: content });
  },

  hideTooltip() {
    set({ tooltipContent: initialStates.tooltipContent });
  },
}));

export function getTreeState() {
  return useTreeStore.getState();
}

export function getTree() {
  return getTreeState()["main"];
}

export function useTree(kind: Kind = "main") {
  return useTreeStore((state) => state[kind]);
}

export function useTreeMeta() {
  return useTreeStore(
    useShallow((state) => ({
      version: state.main.version ?? 0,
      needReset: state.main.needReset ?? false,
    })),
  );
}
