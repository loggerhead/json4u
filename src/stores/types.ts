import { type useEditorStoreCtx } from "./editor";
import { type useStatusStoreCtx } from "./status";
import { type useTreeStoreCtx } from "./tree";

export interface Stores {
  statusStore: ReturnType<typeof useStatusStoreCtx>;
  treeStore: ReturnType<typeof useTreeStoreCtx>;
  editorStore: ReturnType<typeof useEditorStoreCtx>;
}
