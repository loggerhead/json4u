import { memo } from "react";
import { genKeyText, genValueAttrs, type NodeWithData } from "@/lib/graph/layout";
import { rootMarker } from "@/lib/idgen/pointer";
import { getChildrenKeys, hasChildren } from "@/lib/parser/node";
import { cn } from "@/lib/utils";
import { useTree } from "@/stores/treeStore";
import { type NodeProps } from "@xyflow/react";
import { SourceHandle, TargetHandle } from "./Handle";
import Toolbar from "./Toolbar";

export default function ObjectNode({ id, data }: NodeProps<NodeWithData>) {
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
}

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
