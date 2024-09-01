import { useEffect, useRef, useState } from "react";
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
      <div className="nodrag nopan select-text graph-node cursor-default" style={data.style}>
        <TargetHandle node={node} />
        {tree.mapChildren(node, (child, key, i) => (
          <KV key={i} index={i} property={node.type === "array" ? i : key} selected={selected} node={child}></KV>
        ))}
      </div>
    </>
  ) : null;
}

interface KvProps {
  index: number;
  property: string | number;
  node: Node;
  selected?: boolean;
}

function KV({ index, property, selected, node }: KvProps) {
  const keyRef = useRef(null);
  const valueRef = useRef(null);
  const [keyDisableWheel, setKeyDisableWheel] = useState(false);
  const [valueDisableWheel, setValueDisableWheel] = useState(false);
  const keyText = genKeyText(property);
  const { className, text } = genValueAttrs(node);
  const keyClass = typeof property === "number" ? "text-hl-index" : keyText ? "text-hl-key" : "text-hl-empty";

  useEffect(() => {
    if (!selected) {
      return;
    }

    if (keyRef.current) {
      const { offsetWidth, scrollWidth } = keyRef.current;
      scrollWidth > offsetWidth && setKeyDisableWheel(true);
    }

    if (valueRef.current) {
      const { offsetWidth, scrollWidth } = valueRef.current;
      scrollWidth > offsetWidth && setValueDisableWheel(true);
    }
  }, [selected]);

  return (
    <div className="graph-kv">
      <span ref={keyRef} className={cn("graph-k", keyDisableWheel && "nowheel", keyClass)}>
        {keyText}
      </span>
      <span ref={valueRef} className={cn("graph-v", valueDisableWheel && "nowheel", className)}>
        {text}
      </span>
      <SourceHandle id={keyText} node={node} indexInParent={index} />
    </div>
  );
}
