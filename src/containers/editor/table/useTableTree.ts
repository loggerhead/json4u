import { type Dispatch, type RefObject, SetStateAction, useEffect, useState } from "react";
import { ViewMode } from "@/lib/db/config";
import type { TableTree } from "@/lib/table/types";
import { useStatusStore } from "@/stores/statusStore";
import { useTreeMeta } from "@/stores/treeStore";
import { useUserStore } from "@/stores/userStore";
import type { Virtualizer } from "@tanstack/react-virtual";
import { useShallow } from "zustand/shallow";
import { scrollTo } from "./useRevealNode";

export function useTableTree(
  virtualizer: Virtualizer<HTMLDivElement, Element>,
  containerRef: RefObject<HTMLDivElement>,
  setTableTree: Dispatch<SetStateAction<TableTree>>,
) {
  const { count, usable } = useUserStore(
    useShallow((state) => ({
      count: state.count,
      usable: state.usable("tableModeView"),
    })),
  );
  const { isTableView, setShowPricingOverlay, setTableEditModePos } = useStatusStore(
    useShallow((state) => ({
      isTableView: state.viewMode === ViewMode.Table,
      setShowPricingOverlay: state.setShowPricingOverlay,
      setTableEditModePos: state.setTableEditModePos,
    })),
  );
  const { version: treeVersion, needReset } = useTreeMeta();
  // Prevent the graph from being re-rendered when switching to other tabs
  const [renderedVersion, setRenderedVersion] = useState(-1);

  useEffect(() => {
    if (!(window.worker && isTableView) || renderedVersion === treeVersion) {
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
      setRenderedVersion(treeVersion);

      if (needReset) {
        setTableEditModePos(undefined);
        scrollTo(virtualizer, containerRef, 0, 0);
      }

      console.l("create a new table:", treeVersion, needReset, t.width, t.height);
      t.width && count("tableModeView");
    })();
  }, [usable, isTableView, treeVersion, setTableTree]);
}
