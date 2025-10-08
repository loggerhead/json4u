import { memo } from "react";
import { computeSourceHandleOffset, computeTargetHandleOffset } from "@/lib/graph/layout";
import type { GraphNodeId } from "@/lib/idgen";
import { Handle, Position, useReactFlow } from "@xyflow/react";
import { useTranslations } from "next-intl";

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
  nodeId: GraphNodeId;
  indexInParent: number;
  isChildrenHidden?: boolean;
}

export const SourceHandle = memo(({ id, nodeId, indexInParent, isChildrenHidden }: SourceHandleProps) => {
  const top = indexInParent !== undefined ? computeSourceHandleOffset(indexInParent) : undefined;
  const backgroundColor = isChildrenHidden ? "rgb(156 163 175)" : undefined;
  const { setNodes, setEdges } = useReactFlow();
  const t = useTranslations();

  return (
    <Handle
      type="source"
      title={isChildrenHidden ? t("click_to_unfold") : t("click_to_fold")}
      isConnectable
      id={id}
      position={Position.Right}
      style={{ top, backgroundColor }}
      onClick={async (e) => {
        e.stopPropagation();
        const { nodes, edges } = await window.worker.toggleGraphNodeHidden(nodeId, id);
        setNodes(nodes);
        setEdges(edges);
      }}
    />
  );
});
SourceHandle.displayName = "SourceHandle";
