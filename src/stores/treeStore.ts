import { type Kind } from "@/lib/editor/editor";
import { Tree } from "@/lib/parser";
import { type FunctionKeys } from "@/lib/utils";
import { create } from "zustand";
import { useShallow } from "zustand/shallow";

export const sides = ["top", "bottom", "left", "right"];
export type Side = (typeof sides)[number];

export interface TreeState {
  main: Tree;
  secondary: Tree;

  setTree: (tree: Tree, kind: Kind) => void;
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
