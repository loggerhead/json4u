import { useEffect, useState } from "react";
import { ViewMode } from "@/lib/db/config";
import { useEditorStore } from "@/stores/editorStore";
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
  const worker = useEditorStore((state) => state.worker);
  const treeVersion = useTreeVersion();

  const [version, setVersion] = useState(0);
  const [innerHTML, setInnerHTML] = useState("");

  useEffect(() => {
    if (!(worker && isTableView && treeVersion > version)) {
      console.log("Skip table render:", !!worker, isTableView, treeVersion, version);
      return;
    }

    if (!usable) {
      console.log("Skip table render because reach out of free quota.");
      setShowPricingOverlay(true);
      return;
    }

    (async () => {
      const tableHTML = await worker.createTable();
      setInnerHTML(tableHTML);
      setVersion(treeVersion);

      console.log("Create a new table:", treeVersion, tableHTML.length, tableHTML.slice(0, 100));
      tableHTML.length > 0 && count("tableModeView");
    })();
  }, [worker, usable, isTableView, treeVersion, version]);

  return innerHTML ? { __html: innerHTML } : undefined;
}
