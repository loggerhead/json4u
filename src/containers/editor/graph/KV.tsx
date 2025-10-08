import { memo, useCallback, useState } from "react";
import type { RevealTarget } from "@/lib/graph/types";
import { toGraphNodeId } from "@/lib/graph/utils";
import { cn } from "@/lib/utils";
import { useStatusStore } from "@/stores/statusStore";
import { useTree } from "@/stores/treeStore";
import { useTranslations } from "next-intl";
import EditableText from "./EditableText";
import { SourceHandle } from "./Handle";
import useClickNode from "./useClickNode";

interface KvProps {
  id: string; // tree node id of the key
  index: number; // The index of the key-value pair in the node, used to calculate the distance from the handle to the top border of the graph node
  keyText: string;
  keyClassNames: string[];
  valueText: string;
  valueClassNames: string[];
  hasChildren: boolean;
  width: number; // used to avoid width jump when viewport changes
  keyWidth?: number; // the text width of the key in the key-value pair
  valueWidth?: number; // the text width of the value in the key-value pair
  isChildrenHidden?: boolean; // the state of the child nodes in the graph (e.g. whether the child node connected to the handle in the graph is hidden)
  selected?: boolean;
}

const KV = memo((props: KvProps) => {
  const [inputMode, setInputMode] = useState<RevealTarget | "">("");
  const { onClick, cancelClickNode } = useClickNode();
  const t = useTranslations();

  const tree = useTree();
  const parentNode = tree.getParent(props.id)!;
  const graphNodeId = toGraphNodeId(parentNode.id);

  const addToEditQueue = useStatusStore((state) => state.addToEditQueue);
  const onEdit = useCallback(
    (value: string) => {
      if (inputMode) {
        addToEditQueue({ treeNodeId: props.id, target: inputMode, value, version: tree.version });
        setInputMode("");
      }
    },
    [props.id, inputMode, tree.version, addToEditQueue],
  );

  return (
    <div
      className={cn(
        "graph-kv hover:bg-blue-100 dark:hover:bg-blue-900",
        props.selected && "bg-blue-100 dark:bg-blue-900",
        props.hasChildren && "cursor-pointer",
      )}
      title={props.hasChildren ? t("double_click_to_reveal_first_child") : ""}
      style={{ width: props.width }}
      data-tree-id={props.id}
      onClick={inputMode ? undefined : (e) => onClick(e, props.id, "keyValue", "graphClick")}
      onDoubleClick={(e) => {
        if (!(props.hasChildren && !inputMode)) {
          return;
        }

        e.stopPropagation();
        cancelClickNode();
        // Double-click to focus on the first child node
        const childrenIds = tree.childrenIds(tree.node(props.id));

        if (childrenIds.length > 0) {
          const firstChildId = childrenIds[0];
          console.l("double click to focus on the first child node:", firstChildId);
          onClick(e, firstChildId, "keyValue", "graphDoubleClick");
        }
      }}
    >
      <EditableText
        classNames={["graph-k", ...props.keyClassNames]}
        text={props.keyText}
        editable={parentNode.type !== "array"}
        onDoubleClick={() => {
          cancelClickNode();
          setInputMode("key");
        }}
        onClick={(e) => onClick(e, props.id, "key", "graphClick")}
        onEdit={(value) => onEdit(value)}
        title={parentNode.type !== "array" ? t("double_click_to_enter_edit_mode") : undefined}
        popoverWidth={props.width}
        widthInInput={props.keyWidth}
      />
      <EditableText
        classNames={["graph-v", ...props.valueClassNames]}
        text={props.valueText}
        editable={!props.hasChildren}
        onDoubleClick={() => {
          cancelClickNode();
          setInputMode("value");
        }}
        onClick={(e) => onClick(e, props.id, "value", "graphClick")}
        onEdit={(value) => onEdit(value)}
        title={props.hasChildren ? t("double_click_to_reveal_first_child") : t("double_click_to_enter_edit_mode")}
        widthInInput={props.valueWidth}
        popoverWidth={props.width}
      />
      {props.hasChildren && (
        <SourceHandle
          id={props.keyText}
          nodeId={graphNodeId}
          indexInParent={props.index}
          isChildrenHidden={props.isChildrenHidden}
        />
      )}
    </div>
  );
});
KV.displayName = "KV";

export default KV;
