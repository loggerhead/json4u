"use client";

import { useEffect, useState } from "react";
import { ViewMode } from "@/lib/db/config";
import { useStatusStore } from "@/stores/statusStore";
import { useTreeStore, useTreeVersion } from "@/stores/treeStore";
import { useUserStore } from "@/stores/userStore";

export function useTableHTML() {
  const count = useUserStore((state) => state.count);
  const usable = useUserStore((state) => state.usable("tableModeView"));
  const setShowPricingOverlay = useStatusStore((state) => state.setShowPricingOverlay);
  const viewMode = useStatusStore((state) => state.viewMode);
  const treeVersion = useTreeVersion();
  const tableHTML = useTreeStore((state) => state.tableHTML);

  const [version, setVersion] = useState(0);
  const [innerHTML, setInnerHTML] = useState("");

  useEffect(() => {
    if (viewMode === ViewMode.Table && treeVersion > version) {
      if (usable) {
        setVersion(treeVersion);
        setInnerHTML(tableHTML);
        tableHTML.length > 0 && count("tableModeView");
      } else {
        setShowPricingOverlay(true);
      }
    }
  }, [usable, viewMode, treeVersion, version, tableHTML]);

  return innerHTML ? { __html: innerHTML } : undefined;
}
