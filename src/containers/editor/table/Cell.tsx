import { memo } from "react";
import { cellClassMap, globalStyle } from "@/lib/table/style";
import type { TableNode } from "@/lib/table/types";
import { cn } from "@/lib/utils";

interface CellProps extends Omit<TableNode, "next" | "heads"> {
  index: number; // row number
}

const Cell = memo((props: CellProps) => {
  const isDummy = props.row !== props.index;

  return (
    <span
      className={cn("tbl-cell", cellClassMap[props.type], ...(props.classNames ?? []))}
      style={{ width: `${props.width}px`, height: isDummy ? `${globalStyle.rowHeight}px` : undefined }}
    >
      {isDummy ? undefined : props.text}
    </span>
  );
});
Cell.displayName = "Cell";

export default Cell;
