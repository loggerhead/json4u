import { memo } from "react";
import { computeSourceHandleOffset, computeTargetHandleOffset } from "@/lib/graph/layout";
import { Handle, Position } from "@xyflow/react";

interface TargetHandleProps {
  childrenNum: number;
}

export const TargetHandle = memo(({ childrenNum }: TargetHandleProps) => {
  const top = computeTargetHandleOffset(childrenNum);
  return <Handle type="target" isConnectable position={Position.Left} style={{ top }} />;
});
TargetHandle.displayName = "TargetHandle";

interface SourceHandleProps {
  id: string;
  indexInParent: number;
  isChildrenHidden?: boolean;
}

export const SourceHandle = memo(({ id, indexInParent, isChildrenHidden }: SourceHandleProps) => {
  const top = indexInParent !== undefined ? computeSourceHandleOffset(indexInParent) : undefined;
  const opacity = isChildrenHidden ? 0.5 : undefined;
  return <Handle type="source" isConnectable id={id} position={Position.Right} style={{ top, opacity }} />;
});
SourceHandle.displayName = "SourceHandle";
