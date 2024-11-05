import { useEffect, useState } from "react";
import { ViewMode } from "@/lib/db/config";
import { useStatusStore } from "@/stores/statusStore";
import { useTreeVersion } from "@/stores/treeStore";
import { useUserStore } from "@/stores/userStore";
import { useShallow } from "zustand/react/shallow";

export function useTableHTML() {
  const { count, usable } = useUserStore(
    useShallow((state) => ({
      count: state.count,
      usable: state.usable("tableModeView"),
    })),
  );
  const { isTableView, setShowPricingOverlay } = useStatusStore(
    useShallow((state) => ({
      isTableView: state.viewMode === ViewMode.Table,
      setShowPricingOverlay: state.setShowPricingOverlay,
    })),
  );
  const treeVersion = useTreeVersion();
  const [innerHTML, setInnerHTML] = useState("");

  useEffect(() => {
    if (!isTableView) {
      console.l("Skip table render:", isTableView, treeVersion);
      return;
    }

    if (!usable) {
      console.l("Skip table render because reach out of free quota.");
      setShowPricingOverlay(true);
      return;
    }

    (async () => {
      const tableHTML = await window.worker.createTable();
      setInnerHTML(tableHTML);
      console.l("Create a new table:", treeVersion, tableHTML.length, tableHTML.slice(0, 100));
      tableHTML.length > 0 && count("tableModeView");
    })();
  }, [usable, isTableView, treeVersion]);

  return innerHTML ? { __html: innerHTML } : undefined;
}
