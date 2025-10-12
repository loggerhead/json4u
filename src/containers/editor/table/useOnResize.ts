import { RefObject, useEffect, useState } from "react";
import { useDebounceFn } from "@/lib/hooks";
import type { TableTree } from "@/lib/table/types";
import { useResizeObserver } from "usehooks-ts";

export function useOnResize(containerRef: RefObject<HTMLDivElement>, tableTree: TableTree) {
  const [containerHeight, setContainerHeight] = useState(0);
  const [width, setWidth] = useState(0);
  const [height, setHeight] = useState(0);

  useEffect(() => {
    setWidth(tableTree.width);
    setHeight(Math.min(tableTree.height, containerHeight));
  }, [tableTree.width, tableTree.height, containerHeight]);

  const onResize = useDebounceFn(async ({ height }) => setContainerHeight(height), 30, [setContainerHeight]);
  useResizeObserver({ ref: containerRef, onResize });

  return { width, height };
}
