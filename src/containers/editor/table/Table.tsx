"use client";

import { useRef, useState } from "react";
import Background from "@/components/Background";
import { globalStyle } from "@/lib/table/style";
import type { TableTree } from "@/lib/table/types";
import { newTableTree } from "@/lib/table/utils";
import { useVirtualizer } from "@tanstack/react-virtual";
import Cell from "./Cell";
import { useOnResize } from "./useOnResize";
import { useRevealNode } from "./useRevealNode";
import { useTableTree } from "./useTableTree";

export function Table() {
  const containerRef = useRef<HTMLDivElement>(null);
  const virtualRef = useRef<HTMLDivElement>(null);
  const [tableTree, setTableTree] = useState<TableTree>(newTableTree());

  const virtualizer = useVirtualizer({
    count: tableTree.grid.length,
    getScrollElement: () => virtualRef.current,
    estimateSize: (i) => globalStyle.rowHeight,
    overscan: 10,
  });

  useTableTree(virtualizer, containerRef, setTableTree);
  useRevealNode(virtualizer, containerRef, tableTree);
  const { width, height } = useOnResize(containerRef, tableTree);

  return (
    <div ref={containerRef} className="relative w-full h-full overflow-x-auto">
      <div
        ref={virtualRef}
        className="bg-white"
        style={{
          width: `${width + globalStyle.scrollbarWidth}px`,
          height: `${height}px`,
          overflow: "auto",
        }}
      >
        <div style={{ height: `${virtualizer.getTotalSize()}px`, width: "100%", position: "relative" }}>
          {virtualizer.getVirtualItems().map(({ index: row, start }) => (
            <div
              key={row}
              className="tbl-row"
              style={{
                height: globalStyle.rowHeight,
                transform: `translateY(${start}px)`,
              }}
            >
              {tableTree.grid[row].map((nd, col) => (
                <Cell key={`${row}-${col}`} {...nd} rowInTable={row} colInTable={col} />
              ))}
            </div>
          ))}
        </div>
      </div>
      <Background />
    </div>
  );
}
