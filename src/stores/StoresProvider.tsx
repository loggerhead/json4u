"use client";

import { EditorStoreProvider } from "@/stores/editorStore";
import { StatusStoreProvider } from "@/stores/statusStore";
import { TreeStoreProvider } from "@/stores/treeStore";
import { UserStoreProvider } from "@/stores/userStore";

export default function StoresProvider({ children }: React.ComponentProps<"div">) {
  return (
    <UserStoreProvider>
      <StatusStoreProvider>
        <TreeStoreProvider>
          <EditorStoreProvider>{children}</EditorStoreProvider>
        </TreeStoreProvider>
      </StatusStoreProvider>
    </UserStoreProvider>
  );
}
