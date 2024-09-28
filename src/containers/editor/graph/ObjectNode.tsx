import { genKeyText, genValueAttrs, type NodeWithData } from "@/lib/graph/layout";
import { type Node } from "@/lib/parser/node";
import { cn } from "@/lib/utils";
import { useTree } from "@/stores/treeStore";
import { type NodeProps } from "@xyflow/react";
import { SourceHandle, TargetHandle } from "./Handle";
import Toolbar from "./Toolbar";

export default function ObjectNode({ id, data, ...props }: NodeProps<NodeWithData>) {
  const tree = useTree();
  const node = tree.node(id);
  const selected = data.toolbarVisible;

  return node ? (
    <>
      <Toolbar node={node} visible={selected} />
      <div className="nodrag nopan graph-node cursor-default" style={data.style}>
        <TargetHandle node={node} />
        {tree.mapChildren(node, (child, key, i) => (
          <KV key={i} index={i} property={node.type === "array" ? i : key} node={child}></KV>
        ))}
      </div>
    </>
  ) : null;
}

interface KvProps {
  index: number;
  property: string | number;
  node: Node;
}

function KV({ index, property, node }: KvProps) {
  const keyText = genKeyText(property);
  const { className, text } = genValueAttrs(node);
  const keyClass = typeof property === "number" ? "text-hl-index" : keyText ? "text-hl-key" : "text-hl-empty";

  return (
    <div className="graph-kv">
      <div contentEditable="true" suppressContentEditableWarning className={cn("graph-k", keyClass)}>
        {keyText}
      </div>
      <div contentEditable="true" suppressContentEditableWarning className={cn("graph-v", className)}>
        {text}
      </div>
      <SourceHandle id={keyText} node={node} indexInParent={index} />
    </div>
  );
}
