import { useEffect, useState } from "react";
import { ViewMode } from "@/lib/db/config";
import { newTableTree, nodeTo2dArray } from "@/lib/table/tableNode";
import type { TableTree } from "@/lib/table/types";
import { useStatusStore } from "@/stores/statusStore";
import { useTreeMeta } from "@/stores/treeStore";
import { useUserStore } from "@/stores/userStore";
import { useShallow } from "zustand/shallow";

export function useTableTree() {
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
  const { version: treeVersion, needReset } = useTreeMeta();
  const [tableTree, setTableTree] = useState<TableTree>(newTableTree());

  useEffect(() => {
    if (!(window.worker && isTableView)) {
      console.l("skip table render:", isTableView, treeVersion);
      return;
    }

    if (!usable) {
      console.l("skip table render because reach out of free quota.");
      setShowPricingOverlay(true);
      return;
    }

    (async () => {
      const t = await window.worker.createTable();
      setTableTree(t);
      console.l(
        "create a new table:",
        treeVersion,
        nodeTo2dArray(t.root).map((row, idx) => row.map((nd) => (nd.row === idx ? nd.text : ""))),
      );
      t.width && count("tableModeView");
    })();
  }, [usable, isTableView, treeVersion, setTableTree]);

  return tableTree;
}
