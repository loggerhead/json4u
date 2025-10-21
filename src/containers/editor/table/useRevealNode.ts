import { RefObject, useEffect } from "react";
import { ViewMode } from "@/lib/db/config";
import type { TableGrid } from "@/lib/table/types";
import { useStatusStore } from "@/stores/statusStore";
import type { Virtualizer } from "@tanstack/react-virtual";
import { useShallow } from "zustand/shallow";

export function useRevealNode(
  virtualizer: Virtualizer<HTMLDivElement, Element>,
  containerRef: RefObject<HTMLDivElement>,
  tableGrid: TableGrid,
) {
  const { isNeedReveal, revealPosition } = useStatusStore(
    useShallow((state) => ({
      isNeedReveal: state.viewMode === ViewMode.Table && state.isNeedReveal("table"),
      revealPosition: state.revealPosition,
    })),
  );

  // compute the position and the virtual graph of the reveal node.
  useEffect(() => {
    (async () => {
      if (isNeedReveal && revealPosition.treeNodeId) {
        const res = await window.worker.setTableRevealPosition(revealPosition);
        if (!res) {
          console.l("skip reveal position in table:", revealPosition);
          return;
        }

        const { x, y } = tableGrid.grid[res.row][res.col];
        scrollTo(virtualizer, containerRef, x, y);
      }
    })();
  }, [revealPosition, isNeedReveal, tableGrid]);
}

export function scrollTo(
  virtualizer: Virtualizer<HTMLDivElement, Element>,
  containerRef: RefObject<HTMLDivElement>,
  x: number,
  y: number,
) {
  if (!containerRef.current) {
    return;
  }

  if (x === 0 && y === 0) {
    containerRef.current.scroll({ left: 0 });
    virtualizer.scrollToOffset(0);
  } else {
    const containerWidth = containerRef.current.clientWidth;
    const containerHeight = containerRef.current.clientHeight;
    const left = Math.max(x - containerWidth / 2, 0);
    const top = y - containerHeight / 2;
    containerRef.current.scroll({ left, behavior: "smooth" });
    virtualizer.scrollToOffset(top, { behavior: "smooth" });
  }
}
