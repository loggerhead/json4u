"use client";

import { useRef, useState } from "react";
import Background from "@/components/Background";
import { globalStyle } from "@/lib/table/style";
import type { TableGrid } from "@/lib/table/types";
import { newTableGrid } from "@/lib/table/utils";
import { useStatusStore } from "@/stores/statusStore";
import { useVirtualizer } from "@tanstack/react-virtual";
import Cell from "./Cell";
import { useOnResize } from "./useOnResize";
import { useRevealNode } from "./useRevealNode";
import { useTableGrid } from "./useTableGrid";

export function Table() {
  const containerRef = useRef<HTMLDivElement>(null);
  const virtualRef = useRef<HTMLDivElement>(null);
  const [tableGrid, setTableGrid] = useState<TableGrid>(newTableGrid());
  const inputPos = useStatusStore((state) => state.tableEditModePos);

  const virtualizer = useVirtualizer({
    count: tableGrid.grid.length,
    getScrollElement: () => virtualRef.current,
    estimateSize: (i) => globalStyle.rowHeight,
    overscan: 10,
  });

  useTableGrid(virtualizer, containerRef, setTableGrid);
  useRevealNode(virtualizer, containerRef, tableGrid);
  const { width, height } = useOnResize(containerRef, tableGrid);

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
              {tableGrid.grid[row].map((cell, col) => (
                <Cell
                  key={`${row}-${col}`}
                  row={row}
                  col={col}
                  isInput={inputPos?.row === row && inputPos?.col === col}
                  level={cell.level}
                  type={cell.type}
                  width={cell.width}
                  text={cell.text}
                  classNames={cell.classNames}
                  id={cell.id}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
      <Background />
    </div>
  );
}
