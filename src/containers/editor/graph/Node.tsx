import { memo } from "react";
import { genKeyText, genValueAttrs, type NodeWithData } from "@/lib/graph/layout";
import { rootMarker } from "@/lib/idgen/pointer";
import { getChildrenKeys, hasChildren } from "@/lib/parser/node";
import { cn } from "@/lib/utils";
import { useTree } from "@/stores/treeStore";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { SourceHandle, TargetHandle } from "./Handle";
import Toolbar from "./Toolbar";

export const ObjectNode = memo(({ id, data }: NodeProps<NodeWithData>) => {
  const tree = useTree();
  const node = tree.node(id);
  const selected = data.toolbarVisible;

  if (!node) {
    return null;
  }

  return (
    <>
      {selected && <Toolbar id={id} />}
      <div className="nodrag nopan graph-node cursor-default" style={data.style}>
        {node?.id !== rootMarker && <TargetHandle childrenNum={getChildrenKeys(node).length} />}
        {tree.mapChildren(node, (child, key, i) => {
          const { className, text } = genValueAttrs(child);
          return (
            <KV
              key={i}
              index={i}
              property={node.type === "array" ? i : key}
              valueClassName={className}
              valueText={text}
              hasChildren={hasChildren(child)}
            />
          );
        })}
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
}

const KV = memo(({ index, property, valueClassName, valueText, hasChildren }: KvProps) => {
  const keyText = genKeyText(property);
  const keyClass = typeof property === "number" ? "text-hl-index" : keyText ? "text-hl-key" : "text-hl-empty";

  return (
    <div className="graph-kv">
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

export const DummySourceNode = memo(() => {
  return (
    <div className="w-[1px] h-[1px]">
      <Handle type={"source"} isConnectable position={Position.Right} />
    </div>
  );
});
DummySourceNode.displayName = "DummySourceNode";

export const DummyTargetNode = memo(() => {
  return (
    <div className="w-[1px] h-[1px]">
      <Handle type={"target"} isConnectable position={Position.Left} />
    </div>
  );
});
DummyTargetNode.displayName = "DummyTargetNode";
