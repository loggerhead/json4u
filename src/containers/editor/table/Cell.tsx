import { memo, useState } from "react";
import useClickNode from "@/containers/editor/graph/useClickNode";
import type { RevealTarget } from "@/lib/graph/types";
import { isDescendant } from "@/lib/idgen";
import { cellClassMap, globalStyle, headerBgClassNames } from "@/lib/table/style";
import type { TableNode } from "@/lib/table/types";
import { isDummyType, tableNodeTypeToRevealTarget } from "@/lib/table/utils";
import { cn } from "@/lib/utils";
import { useStatusStore } from "@/stores/statusStore";
import { includes } from "lodash-es";
import { useTranslations } from "next-intl";

interface CellProps extends Omit<TableNode, "next" | "heads"> {
  rowInTable: number;
  colInTable: number;
}

const Cell = memo((props: CellProps) => {
  const isDummy = isDummyType(props.type);
  const isEditable = !isDummy && props.id;

  const { onClick, cancelClickNode } = useClickNode();
  const [inputMode, setInputMode] = useState("");
  const t = useTranslations();
  const needHighlight = useStatusStore((state) => {
    const { treeNodeId, target } = state.revealPosition;
    const rt = tableNodeTypeToRevealTarget(props.type);

    if (!includes<RevealTarget>(["keyValue", "graphNode"], target)) {
      return treeNodeId === props.id && target === rt;
    } else if (target === "keyValue" && includes<RevealTarget>(["key", "value"], rt)) {
      return treeNodeId === props.id;
    } else {
      return props.id && isDescendant(treeNodeId, props.id);
    }
  });

  const hlClassName = cellClassMap[props.type];
  const classNames = [
    hlClassName,
    hlClassName === "tbl-header" && headerBgClassNames[props.level % 2],
    props.id && "cursor-pointer",
    isEditable && "hover:bg-blue-100 dark:hover:bg-blue-900",
    needHighlight && "search-highlight",
    ...(props.classNames ?? []),
  ].filter((cls) => cls);

  return (
    <div
      data-type={props.type}
      className={cn("tbl-cell", ...classNames)}
      style={{
        width: `${props.width}px`,
        height: `${globalStyle.rowHeight}px`,
      }}
      title={isEditable ? t("double_click_to_enter_edit_mode") : undefined}
      onClick={(e) => {
        if (props.id) {
          const target = tableNodeTypeToRevealTarget(props.type);
          onClick(e, props.id, target, "table");
        }
      }}
      onDoubleClick={(e) => {
        e.preventDefault();
        e.stopPropagation();

        if (isEditable) {
          cancelClickNode();
          // TODO:
          setInputMode("key");
        }
      }}
    >
      {isDummy ? undefined : props.text}
    </div>
  );
});
Cell.displayName = "Cell";

export default Cell;
