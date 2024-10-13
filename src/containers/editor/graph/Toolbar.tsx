import { memo, ReactNode, useState } from "react";
import { Button } from "@/components/ui/button";
import { type EdgeWithData, type NodeWithData } from "@/lib/graph/layout";
import { join as idJoin, splitParentPointer, toPath } from "@/lib/idgen";
import { useEditor } from "@/stores/editorStore";
import { useStatusStore } from "@/stores/statusStore";
import { NodeToolbar, Position, useReactFlow } from "@xyflow/react";
import { ArrowLeft, CopyMinus, CopyPlus, Focus, SquareMinus, SquarePlus } from "lucide-react";
import { useTranslations } from "next-intl";
import { useHandleClick } from "./useHandleClick";
import { useNodeClick } from "./useNodeClick";
import { separateMap, toggleHidden } from "./utils";

interface ToolbarProps {
  id: string;
}

const Toolbar = memo(({ id }: ToolbarProps) => {
  const [fold, setFold] = useState(true);
  const [foldSiblings, setFoldSiblings] = useState(true);

  const t = useTranslations();
  const editor = useEditor();
  // TODO: fix by use full nodes and edges
  const { getNodes, getEdges, setNodes, setEdges } = useReactFlow<NodeWithData, EdgeWithData>();
  const nodes = getNodes();
  const edges = getEdges();
  const args = { nodes, edges, setNodes, setEdges };

  const { callNodeClick } = useNodeClick(args);
  const { callHandleClick } = useHandleClick(args);
  const { parent: parentId } = splitParentPointer(id);
  const isRoot = parentId === undefined;
  const setRevealId = useStatusStore((state) => state.setRevealId);

  // TODO: change to hide siblings and their descendants
  const triggerFoldSiblings = () => {
    const isSiblingDescendant = (id: string) => {
      const { parent } = splitParentPointer(id);
      // `undefined` means the node is the root node
      if (parentId === undefined) {
        return parent !== undefined;
      }
      return parent?.startsWith(idJoin(parentId, ""));
    };

    setEdges(
      separateMap(
        edges,
        edges.filter((ed) => isSiblingDescendant(ed.target)),
        (ed) => toggleHidden(ed, foldSiblings),
      ),
    );
    setNodes(
      separateMap(
        nodes,
        nodes.filter((nd) => isSiblingDescendant(nd.id)),
        (nd) => toggleHidden(nd, foldSiblings),
      ),
    );
    setFoldSiblings(!foldSiblings);
  };

  // TODO: hide fold button when there is no edges
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
          onClick={() => {
            if (parentId) {
              setRevealId(parentId);
              callNodeClick(parentId);
            }
          }}
        >
          <ArrowLeft className="icon" />
        </ToolbarButton>
      )}
      {!isRoot && (
        <ToolbarButton title={t(foldSiblings ? "fold siblings" : "unfold siblings")} onClick={triggerFoldSiblings}>
          {foldSiblings ? <CopyMinus className="icon" /> : <CopyPlus className="icon" />}
        </ToolbarButton>
      )}
      <ToolbarButton
        title={t(fold ? "fold node" : "unfold node")}
        onClick={() => {
          callHandleClick(id, undefined, fold);
          setFold(!fold);
        }}
      >
        {fold ? <SquareMinus className="icon" /> : <SquarePlus className="icon" />}
      </ToolbarButton>
      <ToolbarButton
        title={t("reveal position in editor")}
        onClick={() => {
          editor?.revealJsonPath(toPath(id));
        }}
      >
        <Focus className="icon" />
      </ToolbarButton>
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
