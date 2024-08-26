"use client";

import { useEffect, useState } from "react";
import { ViewMode } from "@/lib/db/config";
import { useStatusStore } from "@/stores";
import { useTreeStore, useTreeVersion } from "@/stores/tree";

export function useTableHTML() {
  const viewMode = useStatusStore((state) => state.viewMode);
  const treeVersion = useTreeVersion();
  const tableHTML = useTreeStore((state) => state.tableHTML);

  const [version, setVersion] = useState(0);
  const [innerHTML, setInnerHTML] = useState("");

  useEffect(() => {
    if (viewMode === ViewMode.Table && treeVersion > version) {
      setVersion(treeVersion);
      setInnerHTML(tableHTML);
    }
  }, [viewMode, treeVersion, version, tableHTML]);

  return innerHTML ? { __html: innerHTML } : undefined;
}
