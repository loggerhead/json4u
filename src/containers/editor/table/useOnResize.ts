import { RefObject, useEffect, useState } from "react";
import { useDebounceFn } from "@/lib/hooks";
import type { TableGrid } from "@/lib/table/types";
import { useResizeObserver } from "usehooks-ts";

export function useOnResize(containerRef: RefObject<HTMLDivElement>, tableGrid: TableGrid) {
  const [containerHeight, setContainerHeight] = useState(0);
  const [width, setWidth] = useState(0);
  const [height, setHeight] = useState(0);

  useEffect(() => {
    setWidth(tableGrid.width);
    setHeight(Math.min(tableGrid.height, containerHeight));
  }, [tableGrid.width, tableGrid.height, containerHeight]);

  const onResize = useDebounceFn(async ({ height }) => setContainerHeight(height), 30, [setContainerHeight]);
  useResizeObserver({ ref: containerRef, onResize });

  return { width, height };
}
