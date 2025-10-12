"use client";

import { useRef } from "react";
import Background from "@/components/Background";
import { globalStyle } from "@/lib/table/style";
import { getRow } from "@/lib/table/tableNode";
import { useVirtualizer } from "@tanstack/react-virtual";
import Cell from "./Cell";
import { useOnResize } from "./useOnResize";
import { useTableTree } from "./useTableTree";

export function Table() {
  const containerRef = useRef<HTMLDivElement>(null);
  const virtualRef = useRef<HTMLDivElement>(null);

  const tableTree = useTableTree();
  const { width, height } = useOnResize(containerRef, tableTree);
  const virtualizer = useVirtualizer({
    count: tableTree.root.span,
    getScrollElement: () => virtualRef.current,
    estimateSize: (i) => globalStyle.rowHeight,
    overscan: 10,
  });

  return (
    <div ref={containerRef} className="relative w-full h-full overflow-x-auto">
      <div
        ref={virtualRef}
        className="bg-white"
        style={{ width: `${width}px`, height: `${height}px`, overflow: "auto" }}
      >
        <div style={{ height: `${virtualizer.getTotalSize()}px`, width: "100%", position: "relative" }}>
          {virtualizer.getVirtualItems().map(({ index, start }) => (
            <div
              key={index}
              className="tbl-row"
              style={{
                height: globalStyle.rowHeight,
                transform: `translateY(${start}px)`,
              }}
            >
              {getRow(tableTree.root, index).map((nd) => (
                <Cell key={nd.id} {...nd} index={index} />
              ))}
            </div>
          ))}
        </div>
      </div>
      <Background />
    </div>
  );
}
