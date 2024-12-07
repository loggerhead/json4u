"use client";

import { memo, ReactNode } from "react";
import { Button } from "@/components/ui/button";
import type { EdgeWithData, NodeWithData } from "@/lib/graph/types";
import { getParentId } from "@/lib/idgen";
import { useStatusStore } from "@/stores/statusStore";
import { useTreeStore } from "@/stores/treeStore";
import { NodeToolbar, Position, useReactFlow } from "@xyflow/react";
import { ArrowLeft, CopyMinus, CopyPlus, SquareMinus, SquarePlus } from "lucide-react";
import { useTranslations } from "next-intl";
import { useShallow } from "zustand/shallow";

interface ToolbarProps {
  id: string;
}

const Toolbar = memo(({ id }: ToolbarProps) => {
  const t = useTranslations();
  const { setNodes, setEdges } = useReactFlow<NodeWithData, EdgeWithData>();

  const { fold, foldSiblings, toggleFoldNode, toggleFoldSibingsNode, setRevealPosition } = useStatusStore(
    useShallow((state) => ({
      setRevealPosition: state.setRevealPosition,
      toggleFoldNode: state.toggleFoldNode,
      toggleFoldSibingsNode: state.toggleFoldSibingsNode,
      fold: !state.unfoldNodeMap[id],
      foldSiblings: !state.unfoldSiblingsNodeMap[id],
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
        <ToolbarButton
          title={t("go to parent")}
          onClick={async () => {
            if (parentId) {
              const { nodes, edges } = await window.worker.toggleGraphNodeSelected(parentId);
              setNodes(nodes);
              setEdges(edges);
              setRevealPosition({ treeNodeId: parentId, type: "node", from: "graphAll" });
            }
          }}
        >
          <ArrowLeft className="icon" />
        </ToolbarButton>
      )}
      {hasSiblings && (
        <ToolbarButton
          title={t(foldSiblings ? "fold_siblings" : "unfold_siblings")}
          onClick={async () => {
            toggleFoldSibingsNode(id);
            const { nodes, edges } = await window.worker.triggerGraphFoldSiblings(id, foldSiblings);
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
            toggleFoldNode(id);
            const { nodes, edges } = await window.worker.toggleGraphNodeHidden(id, undefined, fold);
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
  onClick: () => void;
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
        onClick();
      }}
    >
      {children}
    </Button>
  );
});
ToolbarButton.displayName = "ToolbarButton";

export default Toolbar;
