import { memo, ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { type EdgeWithData, type NodeWithData } from "@/lib/graph/layout";
import { splitParentPointer, toPath } from "@/lib/idgen";
import { useEditor, useEditorStore } from "@/stores/editorStore";
import { useStatusStore } from "@/stores/statusStore";
import { useTreeStore } from "@/stores/treeStore";
import { NodeToolbar, Position, useReactFlow } from "@xyflow/react";
import { ArrowLeft, CopyMinus, CopyPlus, Focus, SquareMinus, SquarePlus } from "lucide-react";
import { useTranslations } from "next-intl";
import { useShallow } from "zustand/react/shallow";

interface ToolbarProps {
  id: string;
}

const Toolbar = memo(({ id }: ToolbarProps) => {
  const t = useTranslations();
  const editor = useEditor();
  const worker = useEditorStore((state) => state.worker)!;
  const { setNodes, setEdges } = useReactFlow<NodeWithData, EdgeWithData>();

  const { fold, foldSiblings, toggleFoldNode, toggleFoldSibingsNode, setRevealId, setJsonPath } = useStatusStore(
    useShallow((state) => ({
      setRevealId: state.setRevealId,
      setJsonPath: state.setJsonPath,
      toggleFoldNode: state.toggleFoldNode,
      toggleFoldSibingsNode: state.toggleFoldSibingsNode,
      fold: !state.unfoldNodeMap[id],
      foldSiblings: !state.unfoldSiblingsNodeMap[id],
    })),
  );

  const { parent: parentId } = splitParentPointer(id);
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
              setRevealId(parentId);
              const { nodes, edges, jsonPath } = await worker.toggleGraphNodeSelected(parentId);
              setNodes(nodes);
              setEdges(edges);
              setJsonPath(jsonPath);
            }
          }}
        >
          <ArrowLeft className="icon" />
        </ToolbarButton>
      )}
      <ToolbarButton
        title={t("reveal position in editor")}
        onClick={() => {
          editor?.revealJsonPath(toPath(id));
        }}
      >
        <Focus className="icon" />
      </ToolbarButton>
      {hasSiblings && (
        <ToolbarButton
          title={t(foldSiblings ? "fold_siblings" : "unfold_siblings")}
          onClick={async () => {
            toggleFoldSibingsNode(id);
            const { nodes, edges } = await worker.triggerGraphFoldSiblings(id, foldSiblings);
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
            const { nodes, edges } = await worker.toggleGraphNodeHidden(id, undefined, fold);
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
