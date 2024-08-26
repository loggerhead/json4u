import { globalStyle } from "@/lib/graph/layout";
import { rootMarker } from "@/lib/idgen";
import { getChildrenKeys, hasChildren, type Node } from "@/lib/parser/node";
import { Handle, Position } from "@xyflow/react";

interface HandleProps {
  node: Node;
  id?: string;
  indexInParent?: number;
}

export function TargetHandle({ node }: HandleProps) {
  const top = computeTargetHandleOffset(node);
  return node?.id !== rootMarker ? (
    <Handle type="target" isConnectable position={Position.Left} style={{ top }} />
  ) : null;
}

export function SourceHandle({ node, id, indexInParent }: HandleProps) {
  const top = indexInParent !== undefined ? computeSourceHandleOffset(indexInParent) : undefined;
  // TODO: add title to tell user click handle can fold children
  return hasChildren(node) ? (
    <Handle type="source" isConnectable id={id} position={Position.Right} style={{ top }} />
  ) : null;
}

function computeTargetHandleOffset(node: Node) {
  return (getChildrenKeys(node).length * globalStyle.kvHeight) / 2;
}

function computeSourceHandleOffset(i: number) {
  return globalStyle.kvHeight / 2 + i * globalStyle.kvHeight;
}
