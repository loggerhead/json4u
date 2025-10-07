"use client";

import { memo, type MouseEventHandler, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import type { EdgeWithData, NodeWithData } from "@/lib/graph/types";
import { toGraphNodeId } from "@/lib/graph/utils";
import { getParentId } from "@/lib/idgen";
import { useStatusStore } from "@/stores/statusStore";
import { useTreeStore } from "@/stores/treeStore";
import { NodeToolbar, Position, useReactFlow } from "@xyflow/react";
import { ArrowLeft, CopyMinus, CopyPlus, SquareMinus, SquarePlus } from "lucide-react";
import { useTranslations } from "next-intl";
import { useShallow } from "zustand/shallow";
import useClickNode from "./useClickNode";

interface ToolbarProps {
  id: string;
}

const Toolbar = memo(({ id }: ToolbarProps) => {
  const t = useTranslations();
  const { setNodes, setEdges } = useReactFlow<NodeWithData, EdgeWithData>();
  const { onClick } = useClickNode();
  const graphNodeId = toGraphNodeId(id);

  const { fold, foldSiblings, toggleFoldNode, toggleFoldSibingsNode } = useStatusStore(
    useShallow((state) => ({
      toggleFoldNode: state.toggleFoldNode,
      toggleFoldSibingsNode: state.toggleFoldSibingsNode,
      fold: !state.unfoldNodeMap[graphNodeId],
      foldSiblings: !state.unfoldSiblingsNodeMap[graphNodeId],
    })),
  );

  const parentId = getParentId(id);
  const isRoot = parentId === undefined;
  const tree = useTreeStore((state) => state.main);
  const hasSiblings = !isRoot && tree.nonLeafChildrenNodes(tree.node(parentId)).length > 1;
  const hasNonLeafChildren = tree.nonLeafChildrenNodes(tree.node(id)).length > 0;

  return (
    <NodeToolbar
      isVisible={true}
      className="flex items-center justify-center w-fit h-fit bg-input"
      position={Position.Top}
      align="start"
      offset={0}
    >
      {!isRoot && (
        <ToolbarButton title={t("go to parent")} onClick={(e) => parentId && onClick(e, id, "key", "graphButton")}>
          <ArrowLeft className="icon" />
        </ToolbarButton>
      )}
      {hasSiblings && (
        <ToolbarButton
          title={t(foldSiblings ? "fold_siblings" : "unfold_siblings")}
          onClick={async () => {
            toggleFoldSibingsNode(graphNodeId);
            const { nodes, edges } = await window.worker.triggerGraphFoldSiblings(graphNodeId, foldSiblings);
            setNodes(nodes);
            setEdges(edges);
          }}
        >
          {foldSiblings ? <CopyMinus className="icon" /> : <CopyPlus className="icon" />}
        </ToolbarButton>
      )}
      {hasNonLeafChildren && (
        <ToolbarButton
          title={t(fold ? "fold node" : "unfold node")}
          onClick={async () => {
            toggleFoldNode(graphNodeId);
            const { nodes, edges } = await window.worker.toggleGraphNodeHidden(graphNodeId, undefined, fold);
            setNodes(nodes);
            setEdges(edges);
          }}
        >
          {fold ? <SquareMinus className="icon" /> : <SquarePlus className="icon" />}
        </ToolbarButton>
      )}
    </NodeToolbar>
  );
});
Toolbar.displayName = "Toolbar";

interface ToolbarButtonProps {
  title: string;
  onClick: MouseEventHandler<HTMLButtonElement>;
  children: ReactNode;
}

const ToolbarButton = memo(({ title, onClick, children }: ToolbarButtonProps) => {
  return (
    <Button
      variant="icon"
      className="h-6 w-6 p-1"
      title={title}
      onClick={(ev) => {
        ev.preventDefault();
        ev.stopPropagation();
        onClick(ev);
      }}
    >
      {children}
    </Button>
  );
});
ToolbarButton.displayName = "ToolbarButton";

export default Toolbar;
