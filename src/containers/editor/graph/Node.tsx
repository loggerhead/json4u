import { memo, useEffect, useState } from "react";
import { computeSourceHandleOffset, genKeyText, genValueAttrs, globalStyle } from "@/lib/graph/layout";
import type { NodeWithData } from "@/lib/graph/types";
import { isChild, rootMarker } from "@/lib/idgen/pointer";
import { getChildrenKeys, hasChildren, isIterableType, type NodeType } from "@/lib/parser/node";
import { cn } from "@/lib/utils";
import { useStatusStore } from "@/stores/statusStore";
import { useTree } from "@/stores/treeStore";
import { Handle, Position, useReactFlow, type NodeProps } from "@xyflow/react";
import { filter } from "lodash-es";
import { useTranslations } from "next-intl";
import { useShallow } from "zustand/shallow";
import { SourceHandle, TargetHandle } from "./Handle";
import Popover from "./Popover";
import Toolbar from "./Toolbar";
import useClickNode from "./useClickNode";

export const ObjectNode = memo(({ id, data }: NodeProps<NodeWithData>) => {
  const { getNode: getGraphNode } = useReactFlow();
  const tree = useTree();
  const treeNode = tree.node(id);
  const graphNode = getGraphNode(id) as NodeWithData | undefined;

  const { revealNodeId, revealType } = useStatusStore(
    useShallow((state) => {
      const { treeNodeId, type: revealType } = state.revealPosition;
      if (treeNodeId === id) {
        return { revealNodeId: id, revealType };
      } else if (isChild(id, treeNodeId)) {
        return { revealNodeId: treeNodeId, revealType };
      } else {
        return { revealNodeId: "", revealType };
      }
    }),
  );

  if (!treeNode || !graphNode) {
    return null;
  }

  const width = graphNode.data.width;
  const childrenNum = getChildrenKeys(treeNode).length;
  const { kvStart, kvEnd, virtualHandleIndices } = graphNode.data.render;

  return (
    <>
      {data.toolbarVisible && <Toolbar id={id} />}
      <div
        className="graph-node nodrag nopan cursor-default"
        role="treeitem"
        aria-selected={data.selected}
        data-tree-id={id}
        style={data.style}
      >
        {treeNode.id !== rootMarker && <TargetHandle childrenNum={childrenNum} />}
        {kvStart > 0 && <div style={{ width, height: kvStart * globalStyle.kvHeight }} />}
        {filter(
          tree.mapChildren(treeNode, (child, key, i) => {
            if (virtualHandleIndices?.[i]) {
              return (
                <Handle
                  key={i}
                  type="source"
                  isConnectable
                  id={key}
                  position={Position.Right}
                  style={{ top: computeSourceHandleOffset(i) }}
                />
              );
            } else if (kvStart <= i && i < kvEnd) {
              const kvTreeNodeId = child.id;
              const property = treeNode.type === "array" ? i : key;
              const keyText = genKeyText(property);
              const keyClassName =
                typeof property === "number" ? "text-hl-index" : keyText ? "text-hl-key" : "text-hl-empty";
              const hlClassName = revealNodeId === kvTreeNodeId && "search-highlight";
              const { className, text } = genValueAttrs(child);

              return (
                <KV
                  id={kvTreeNodeId}
                  key={i}
                  index={i}
                  nodeType={child.type}
                  keyText={keyText}
                  keyClassNames={[keyClassName, (revealType === "key" && hlClassName) || ""]}
                  valueText={text}
                  valueClassNames={[className, (revealType === "value" && hlClassName) || ""]}
                  hasChildren={hasChildren(child)}
                  isChildrenHidden={getGraphNode(kvTreeNodeId)?.hidden}
                  selected={data.selectedKvId === kvTreeNodeId}
                  width={width}
                  keyWidth={graphNode.data.kvWidthMap[key][0]}
                  valueWidth={graphNode.data.kvWidthMap[key][1]}
                />
              );
            } else {
              return null;
            }
          }),
        )}
        {childrenNum > kvEnd && <div style={{ width, height: (childrenNum - kvEnd) * globalStyle.kvHeight }} />}
      </div>
    </>
  );
});
ObjectNode.displayName = "ObjectNode";

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
  keyWidth: number; // the text width of the key in the key-value pair
  valueWidth: number; // the text width of the value in the key-value pair
  isChildrenHidden?: boolean; // the state of the child nodes in the graph (e.g. whether the child node connected to the handle in the graph is hidden)
  selected?: boolean;
}

const KV = memo((props: KvProps) => {
  const isIterable = isIterableType(props.nodeType);

  const [isInput, setIsInput] = useState(false);
  const [content, setContent] = useState(props.valueText);
  const tree = useTree();
  const onClick = useClickNode();
  const t = useTranslations();
  const addToEditQueue = useStatusStore((state) => state.addToEditQueue);

  useEffect(() => {
    if (!isInput && content !== props.valueText) {
      addToEditQueue({ treeNodeId: props.id, value: content });
    }
  }, [props.id, isInput, content]);

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
      onClick={isInput ? undefined : (e) => onClick(e, props.id, "key")}
      onDoubleClick={(e) => {
        // Prevent double-click from triggering viewport zoom (https://reactflow.dev/learn/concepts/the-viewport)
        e.stopPropagation();

        // Double-click to focus on the first child node
        if (isIterable && !isInput) {
          const childrenIds = tree.childrenIds(tree.node(props.id));
          childrenIds.length > 0 && onClick(e, childrenIds[0], "key", "graphButton");
        }
      }}
    >
      <Popover width={props.width} hlClassNames={props.keyClassNames.slice(0, 1)} text={props.keyText}>
        <div className={cn("graph-k hover:bg-yellow-100", ...props.keyClassNames)}>{props.keyText}</div>
      </Popover>
      <Popover width={props.width} hlClassNames={props.valueClassNames.slice(0, 1)} text={content}>
        {
          // If in input mode, render an input field for editing the content
          isInput ? (
            <input
              className={cn("graph-v", ...props.valueClassNames)}
              style={{ width: props.valueWidth }}
              value={content}
              // Stop the click event from propagating to prevent unwanted parent element clicks
              onClick={(e) => e.stopPropagation()}
              onChange={(e) => setContent(e.target.value)}
              onBlur={() => setIsInput(false)}
              onKeyDown={(e) => e.key === "Enter" && setIsInput(false)}
              autoFocus
              onFocus={(e) => (e.target as HTMLInputElement).select()}
            />
          ) : (
            // If not in input mode, render a div displaying the content
            <div
              className={cn("graph-v hover:bg-yellow-100", ...props.valueClassNames)}
              title={isIterable ? t("double_click_to_reveal_first_child") : t("double_click_to_enter_edit_mode")}
              onClick={(e) => onClick(e, props.id, "value")}
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

export const RootNode = memo(({ id, data }: NodeProps<NodeWithData>) => {
  const tree = useTree();
  const node = tree.root();

  if (!node) {
    return null;
  }

  const { className, text } = genValueAttrs(node);

  return (
    <div className="graph-node" style={data.style} role="treeitem" aria-selected={data.selected} data-tree-id={id}>
      <div className="graph-kv">
        <div className={className}>{text}</div>
      </div>
    </div>
  );
});
RootNode.displayName = "RootNode";

// if the target of the edge is not in the viewport, then use a VirtualTargetNode to represent it
export const VirtualTargetNode = memo(() => {
  return (
    <div className="w-[1px] h-[1px]">
      <Handle type={"target"} isConnectable position={Position.Left} />
    </div>
  );
});
VirtualTargetNode.displayName = "VirtualTargetNode";
