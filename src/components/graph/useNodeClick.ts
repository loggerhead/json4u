import { useCallback } from "react";
import { type NodeWithData } from "@/lib/graph/layout";
import { type Node as FlowNode, useReactFlow } from "@xyflow/react";
import { NodesAndEdges } from "./useNodesAndEdges";
import { getAncestor, getDescendant, highlightEdge, highlightNode, separateMap, toggleToolbar } from "./utils";

// highlight nodes and edges when click on a node
export function useNodeClick({ nodes, edges, setNodes, setEdges }: NodesAndEdges) {
  const { getNode, getEdge } = useReactFlow();

  const callNodeClick = useCallback(
    (id: string) => {
      const node = getNode(id) as NodeWithData;
      const { nodes: ancestorNodes, edges: ancestorEdges } = getAncestor(node, getNode, getEdge);
      const { nodes: descendantNodes, edges: descendantEdges } = getDescendant(node, getNode, getEdge);

      setEdges(
        separateMap(
          edges,
          [...ancestorEdges, ...descendantEdges],
          (ed) => highlightEdge(ed, true),
          (ed) => highlightEdge(ed, false),
        ),
      );
      setNodes(
        separateMap(
          nodes,
          [node, ...ancestorNodes, ...descendantNodes],
          (nd) => toggleToolbar(highlightNode(nd, true), node),
          (nd) => toggleToolbar(highlightNode(nd, false), node),
        ),
      );
    },
    [nodes, edges],
  );

  return { callNodeClick, onMouseClickNode: (_: React.MouseEvent, node: FlowNode) => callNodeClick(node.id) };
}
