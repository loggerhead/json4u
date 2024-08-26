import { useEditorStoreCtx } from "./editor";
import { useStatusStoreCtx } from "./status";
import { useTreeStoreCtx } from "./tree";
import { Stores } from "./types";

export * from "./editor";
export * from "./status";
export * from "./tree";

export function useStores(): Stores {
  return {
    statusStore: useStatusStoreCtx(),
    treeStore: useTreeStoreCtx(),
    editorStore: useEditorStoreCtx(),
  };
}
