import { memo } from "react";
import {
  computeSourceHandleOffset,
  genKeyText,
  genValueAttrs,
  globalStyle,
  type NodeWithData,
} from "@/lib/graph/layout";
import { rootMarker } from "@/lib/idgen/pointer";
import { getChildrenKeys, hasChildren } from "@/lib/parser/node";
import { cn } from "@/lib/utils";
import { useTree, useTreeStore } from "@/stores/treeStore";
import { Handle, Position, useReactFlow, type NodeProps } from "@xyflow/react";
import { filter, keyBy } from "lodash-es";
import { SourceHandle, TargetHandle } from "./Handle";
import Toolbar from "./Toolbar";

export const ObjectNode = memo(({ id, data }: NodeProps<NodeWithData>) => {
  const { getNode } = useReactFlow();
  const tree = useTree();
  const node = tree.node(id);
  const flowNode = getNode(id) as NodeWithData | undefined;

  if (!node || !flowNode) {
    return null;
  }

  const width = flowNode.data.width;
  const childrenNum = getChildrenKeys(node).length;
  const { kvStart, kvEnd, dummyHandleStart, dummyHandleEnd } = flowNode.data.renderArea;

  return (
    <>
      {data.toolbarVisible && <Toolbar id={id} />}
      <div className="nodrag nopan graph-node cursor-default" style={data.style}>
        {node.id !== rootMarker && <TargetHandle childrenNum={childrenNum} />}
        {kvStart > 0 && <div style={{ width, height: kvStart * globalStyle.kvHeight }} />}
        {filter(
          tree.mapChildren(node, (child, key, i) => {
            // if the source of the edge is in the viewport, but some of its children are dummy handles
            if (
              dummyHandleStart !== undefined &&
              dummyHandleEnd !== undefined &&
              dummyHandleStart <= i &&
              i < dummyHandleEnd
            ) {
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
              const { className, text } = genValueAttrs(child);
              return (
                <KV
                  key={i}
                  index={i}
                  property={node.type === "array" ? i : key}
                  valueClassName={className}
                  valueText={text}
                  hasChildren={hasChildren(child)}
                  width={width}
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
  index: number;
  property: string | number;
  valueClassName: string;
  valueText: string;
  hasChildren: boolean;
  width: number; // used to avoid width jump when viewport changes
}

const KV = memo(({ index, property, valueClassName, valueText, hasChildren, width }: KvProps) => {
  const keyText = genKeyText(property);
  const keyClass = typeof property === "number" ? "text-hl-index" : keyText ? "text-hl-key" : "text-hl-empty";

  return (
    <div className="graph-kv" style={{ width }}>
      <div contentEditable="true" suppressContentEditableWarning className={cn("graph-k", keyClass)}>
        {keyText}
      </div>
      <div contentEditable="true" suppressContentEditableWarning className={cn("graph-v", valueClassName)}>
        {valueText}
      </div>
      {hasChildren && <SourceHandle id={keyText} indexInParent={index} />}
    </div>
  );
});
KV.displayName = "KV";

export const RootNode = memo(({ data }: NodeProps<NodeWithData>) => {
  const tree = useTree();
  const node = tree.root();

  if (!node) {
    return null;
  }

  const { className, text } = genValueAttrs(node);

  return (
    <div className="graph-node" style={data.style}>
      <div className="graph-kv">
        <div className={className}>{text}</div>
      </div>
    </div>
  );
});
RootNode.displayName = "RootNode";

// if the target of the edge is not in the viewport, then use a DummyTargetNode to represent it
export const DummyTargetNode = memo(() => {
  return (
    <div className="w-[1px] h-[1px]">
      <Handle type={"target"} isConnectable position={Position.Left} />
    </div>
  );
});
DummyTargetNode.displayName = "DummyTargetNode";
