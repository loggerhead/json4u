import { memo } from "react";
import { computeSourceHandleOffset, genKeyText, genValueAttrs } from "@/lib/graph/layout";
import { globalStyle } from "@/lib/graph/style";
import type { NodeWithData } from "@/lib/graph/types";
import { isChild, rootMarker } from "@/lib/idgen/pointer";
import { getChildrenKeys, hasChildren } from "@/lib/parser/node";
import { useStatusStore } from "@/stores/statusStore";
import { useTree } from "@/stores/treeStore";
import { Handle, Position, useReactFlow, type NodeProps } from "@xyflow/react";
import { filter } from "lodash-es";
import { useShallow } from "zustand/shallow";
import { TargetHandle } from "./Handle";
import KV from "./KV";
import Toolbar from "./Toolbar";

export const ObjectNode = memo(({ id, data }: NodeProps<NodeWithData>) => {
  const { getNode: getGraphNode } = useReactFlow();
  const tree = useTree();
  const treeNode = tree.node(id);
  const graphNode = getGraphNode(id) as NodeWithData | undefined;

  const { revealNodeId, revealTarget } = useStatusStore(
    useShallow((state) => {
      const { treeNodeId, target: revealTarget } = state.revealPosition;
      if (treeNodeId === id) {
        return { revealNodeId: id, revealTarget };
      } else if (isChild(id, treeNodeId)) {
        return { revealNodeId: treeNodeId, revealTarget };
      } else {
        return { revealNodeId: "", revealTarget };
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
              const property = treeNode.type === "array" ? i : key;
              const keyText = genKeyText(property);
              const keyClassName =
                typeof property === "number" ? "text-hl-index" : keyText ? "text-hl-key" : "text-hl-empty";

              const kvTreeNodeId = child.id;
              const hlClassName = revealNodeId === kvTreeNodeId && "search-highlight";
              const { className, text } = genValueAttrs(child);

              return (
                <KV
                  id={kvTreeNodeId}
                  key={i}
                  index={i}
                  keyText={keyText}
                  keyClassNames={[keyClassName, (revealTarget === "key" && hlClassName) || ""]}
                  valueText={text}
                  valueClassNames={[className, (revealTarget === "value" && hlClassName) || ""]}
                  hasChildren={hasChildren(child)}
                  isChildrenHidden={getGraphNode(kvTreeNodeId)?.hidden}
                  selected={data.selectedKvId === kvTreeNodeId}
                  width={width}
                  keyWidth={graphNode.data.kvWidthMap?.[key]?.[0]}
                  valueWidth={graphNode.data.kvWidthMap?.[key]?.[1]}
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
