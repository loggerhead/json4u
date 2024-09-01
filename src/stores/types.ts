import type { StoreApi, UseBoundStore } from "zustand";
import type { EditorState } from "./editorStore";
import type { StatusState } from "./statusStore";
import type { TreeState } from "./treeStore";
import type { UserState } from "./userStore";

export interface Stores {
  userStore: UseBoundStore<StoreApi<UserState>>;
  statusStore: UseBoundStore<StoreApi<StatusState>>;
  treeStore: UseBoundStore<StoreApi<TreeState>>;
  editorStore: UseBoundStore<StoreApi<EditorState>>;
}

declare global {
  interface Window extends Stores {}
}

export type StoreName = keyof Stores;
