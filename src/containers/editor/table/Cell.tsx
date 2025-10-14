import { memo } from "react";
import { borderClassMap, cellClassMap, globalStyle, headerBgClassNames } from "@/lib/table/style";
import { isDummyType } from "@/lib/table/tableNode";
import type { TableNode } from "@/lib/table/types";
import { cn } from "@/lib/utils";

interface CellProps extends Omit<TableNode, "next" | "heads"> {
  rowInTable: number;
  colInTable: number;
}

const Cell = memo((props: CellProps) => {
  const isDummy = isDummyType(props.type);
  const isHeader = props.type === "header" || props.type === "dummyHeader";

  let classNames = props.borders.map((border) => borderClassMap[border]);
  classNames.push(cellClassMap[props.type]);
  classNames.push(isHeader ? headerBgClassNames[props.level % 2] : "");
  classNames.push(isDummy ? "" : "hover:bg-blue-100 dark:hover:bg-blue-900");
  classNames.push(...(props.classNames ?? []));
  classNames = classNames.filter((cls) => cls);

  return (
    <div
      id={props.id}
      data-type={props.type}
      data-position={`${props.rowInTable},${props.colInTable}`}
      data-level={props.level}
      className={cn("tbl-cell", ...classNames)}
      style={{
        width: `${props.width}px`,
        height: `${globalStyle.rowHeight}px`,
      }}
    >
      {isDummy ? undefined : props.text}
    </div>
  );
});
Cell.displayName = "Cell";

export default Cell;
