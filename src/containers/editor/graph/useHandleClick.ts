import { useCallback } from "react";
import { type NodeWithData } from "@/lib/graph/layout";
import { join } from "@/lib/idgen";
import { useReactFlow, type OnConnectStart } from "@xyflow/react";
import { NodesAndEdges } from "./useNodesAndEdges";
import { getDescendant, separateMap, toggleHidden } from "./utils";

export function useHandleClick({ nodes, edges, setNodes, setEdges }: NodesAndEdges) {
  const { getNode, getEdge } = useReactFlow();

  const callHandleClick = useCallback(
    (id: string, handleId?: string, hide?: boolean) => {
      const node = getNode(id) as NodeWithData;
      const prefixId = handleId !== undefined ? join(id, handleId) : undefined;
      const { nodes: descendantNodes, edges: descendantEdges } = getDescendant(node, getNode, getEdge, prefixId);
      const isHide = hide ?? !(descendantNodes[0]?.hidden ?? false);

      setEdges(separateMap(edges, descendantEdges, (ed) => toggleHidden(ed, isHide)));
      setNodes(separateMap(nodes, descendantNodes, (nd) => toggleHidden(nd, isHide)));
    },
    [nodes, edges],
  );

  return {
    callHandleClick,
    onMouseClickHandle: (_: any, { nodeId, handleId, handleType }: Parameters<OnConnectStart>[1]) => {
      if (handleType === "target" || !nodeId || !handleId) {
        return;
      }
      callHandleClick(nodeId, handleId);
    },
  };
}
