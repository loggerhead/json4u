import { ReactNode, useState } from "react";
import { Button } from "@/components/ui/button";
import { type EdgeWithData, type NodeWithData } from "@/lib/graph/layout";
import { join as idJoin, splitParentPointer, toPath } from "@/lib/idgen";
import { type Node } from "@/lib/parser/node";
import { useEditor } from "@/stores/editorStore";
import { useStatusStore } from "@/stores/statusStore";
import { NodeToolbar, Position, useReactFlow } from "@xyflow/react";
import { ArrowLeft, CopyMinus, CopyPlus, Focus, SquareMinus, SquarePlus } from "lucide-react";
import { useTranslations } from "next-intl";
import { useHandleClick } from "./useHandleClick";
import { useNodeClick } from "./useNodeClick";
import { separateMap, toggleHidden } from "./utils";

interface ToolbarProps {
  node: Node;
  visible?: boolean;
}

export default function Toolbar({ node, visible }: ToolbarProps) {
  const [fold, setFold] = useState(true);
  const [foldSiblings, setFoldSiblings] = useState(true);

  const t = useTranslations();
  const editor = useEditor();
  const { getNodes, getEdges, setNodes, setEdges } = useReactFlow<NodeWithData, EdgeWithData>();
  const nodes = getNodes();
  const edges = getEdges();
  const args = { nodes, edges, setNodes, setEdges };

  const id = node.id;
  const { callNodeClick } = useNodeClick(args);
  const { callHandleClick } = useHandleClick(args);
  const { parent: parentId } = splitParentPointer(id);
  const setRevealId = useStatusStore((state) => state.setRevealId);

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

  // TODO: fix w-fit doesn't work
  return (
    <NodeToolbar
      className="flex items-center justify-center w-[96px] h-fit bg-input"
      isVisible={visible}
      position={Position.Top}
      align="start"
      offset={0}
    >
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
      <ToolbarButton title={t(foldSiblings ? "fold sibings" : "unfold sibings")} onClick={triggerFoldSiblings}>
        {foldSiblings ? <CopyMinus className="icon" /> : <CopyPlus className="icon" />}
      </ToolbarButton>
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
}

interface ToolbarButtonProps {
  title: string;
  onClick: () => void;
  children: ReactNode;
}

function ToolbarButton({ title, onClick, children }: ToolbarButtonProps) {
  return (
    <Button
      variant="icon"
      className="h-5 w-5 p-1"
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
}
