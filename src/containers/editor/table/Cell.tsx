import { memo, useCallback, useEffect, useState } from "react";
import useClickNode from "@/containers/editor/graph/useClickNode";
import type { RevealTarget } from "@/lib/graph/types";
import { isDescendant } from "@/lib/idgen";
import { cellClassMap, globalStyle, headerBgClassNames } from "@/lib/table/style";
import type { TableNode, TableNodeType } from "@/lib/table/types";
import { isDummyType, tableNodeTypeToRevealTarget } from "@/lib/table/utils";
import { cn } from "@/lib/utils";
import { useStatusStore } from "@/stores/statusStore";
import { useTreeMeta } from "@/stores/treeStore";
import { includes } from "lodash-es";
import { useTranslations } from "next-intl";
import { useShallow } from "zustand/shallow";

interface CellProps extends Omit<TableNode, "next" | "heads"> {
  rowInTable: number;
  colInTable: number;
}

const Cell = memo((props: CellProps) => {
  const isDummy = isDummyType(props.type);
  const isEditable = !isDummy && props.id && includes<TableNodeType>(["key", "value"], props.type);
  const target = tableNodeTypeToRevealTarget(props.type);

  const { onClick, cancelClickNode } = useClickNode();
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
  const style = {
    width: `${props.width}px`,
    height: `${globalStyle.rowHeight}px`,
  };

  const [content, setContent] = useState(props.text);
  const { version: treeVersion } = useTreeMeta();
  const { setTableEditModePos, addToEditQueue } = useStatusStore(
    useShallow((state) => ({
      setTableEditModePos: state.setTableEditModePos,
      addToEditQueue: state.addToEditQueue,
    })),
  );
  const isInput = useStatusStore((state) => {
    const p = state.tableEditModePos;
    return p?.row === props.rowInTable && p?.col === props.colInTable;
  });

  const callEdit = useCallback(() => {
    addToEditQueue({ treeNodeId: props.id!, target, value: content, version: treeVersion });
    setTableEditModePos(undefined);
  }, [content, props]);

  useEffect(() => {
    setContent(props.text);
    setTableEditModePos(undefined);
  }, [props.text]);

  return isInput ? (
    <input
      className={cn("tbl-cell", ...classNames)}
      style={style}
      value={content}
      onClick={(e) => e.stopPropagation()}
      onChange={(e) => setContent(e.target.value)}
      onFocus={(e) => e.target.select()}
      autoFocus
      onBlur={callEdit}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          e.stopPropagation();
          callEdit();
        }
      }}
    />
  ) : (
    <div
      data-type={props.type}
      className={cn("tbl-cell", ...classNames)}
      style={style}
      title={isEditable ? t("double_click_to_enter_edit_mode") : undefined}
      onClick={(e) => {
        if (props.id) {
          onClick(e, props.id, target, "table");
        }
      }}
      onDoubleClick={(e) => {
        e.preventDefault();
        e.stopPropagation();

        if (isEditable) {
          cancelClickNode();
          setTableEditModePos({ row: props.rowInTable, col: props.colInTable });
        }
      }}
    >
      {isDummy ? undefined : props.text}
    </div>
  );
});
Cell.displayName = "Cell";

export default Cell;
