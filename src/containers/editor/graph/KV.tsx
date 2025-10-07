import { memo, useCallback, useState } from "react";
import { isIterableType, type NodeType } from "@/lib/parser/node";
import { cn } from "@/lib/utils";
import { useStatusStore } from "@/stores/statusStore";
import { useTree } from "@/stores/treeStore";
import { useTranslations } from "next-intl";
import { SourceHandle } from "./Handle";
import Popover from "./Popover";
import useClickNode from "./useClickNode";

interface KvProps {
  id: string; // tree node id of the key
  index: number; // The index of the key-value pair in the node, used to calculate the distance from the handle to the top border of the graph node
  nodeType: NodeType;
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
  const isIterable = isIterableType(props.nodeType);
  const keyClassNamesWithoutHighlight = props.keyClassNames.slice(0, 1);
  const valueClassNamesWithoutHighlight = props.valueClassNames.slice(0, 1);

  const [isInput, setIsInput] = useState(false);
  const [content, setContent] = useState(props.valueText);
  const tree = useTree();
  const onClick = useClickNode();
  const t = useTranslations();

  const addToEditQueue = useStatusStore((state) => state.addToEditQueue);
  const callEdit = useCallback(() => {
    setIsInput(false);
    addToEditQueue({ treeNodeId: props.id, value: content, version: tree.version });
  }, [props.id, content, tree.version]);

  return (
    <div
      className={cn(
        "graph-kv hover:bg-blue-100 dark:hover:bg-blue-900",
        props.selected && "bg-blue-100 dark:bg-blue-900",
        isIterable && "cursor-pointer",
      )}
      title={isIterable ? t("double_click_to_reveal_first_child") : ""}
      style={{ width: props.width }}
      data-tree-id={props.id}
      onClick={isInput ? undefined : (e) => onClick(e, props.id, "key", "graphClick")}
      onDoubleClick={(e) => {
        // Prevent double-click from triggering viewport zoom (https://reactflow.dev/learn/concepts/the-viewport)
        e.stopPropagation();

        // Double-click to focus on the first child node
        if (isIterable && !isInput) {
          const childrenIds = tree.childrenIds(tree.node(props.id));
          childrenIds.length > 0 && onClick(e, childrenIds[0], "key", "graphClick");
        }
      }}
    >
      <Popover width={props.width} hlClassNames={keyClassNamesWithoutHighlight} text={props.keyText}>
        <div className={cn("graph-k hover:bg-yellow-100", ...props.keyClassNames)}>{props.keyText}</div>
      </Popover>
      <Popover width={props.width} hlClassNames={valueClassNamesWithoutHighlight} text={content}>
        {
          // If in input mode, render an input field for editing the content
          isInput ? (
            <input
              className={cn("graph-v", ...valueClassNamesWithoutHighlight)}
              style={{ width: props.valueWidth }}
              value={content}
              // Stop the click event from propagating to prevent unwanted parent element clicks
              onClick={(e) => e.stopPropagation()}
              onChange={(e) => setContent(e.target.value)}
              onFocus={(e) => (e.target as HTMLInputElement).select()}
              autoFocus
              onBlur={callEdit}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  callEdit();
                }
              }}
            />
          ) : (
            // If not in input mode, render a div displaying the content
            <div
              className={cn("graph-v hover:bg-yellow-100", ...props.valueClassNames)}
              title={isIterable ? t("double_click_to_reveal_first_child") : t("double_click_to_enter_edit_mode")}
              onClick={(e) => onClick(e, props.id, "value", "graphClick")}
              // Double-click to enter input mode
              onDoubleClick={() => !isIterable && setIsInput(true)}
            >
              {content}
            </div>
          )
        }
      </Popover>
      {props.hasChildren && (
        <SourceHandle id={props.keyText} indexInParent={props.index} isChildrenHidden={props.isChildrenHidden} />
      )}
    </div>
  );
});
KV.displayName = "KV";

export default KV;
