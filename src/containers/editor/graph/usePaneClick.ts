import { useCallback } from "react";
import { clone } from "@/lib/utils";
import { NodesAndEdges } from "./useNodesAndEdges";
import { highlightEdge, highlightNode, toggleToolbar } from "./utils";

// clear all animated for edges
export function usePaneClick({ nodes, edges, setNodes, setEdges }: NodesAndEdges) {
  return useCallback(
    (_: React.MouseEvent) => {
      setEdges(edges.map((ed) => clone(highlightEdge(ed, false))));
      setNodes(nodes.map((nd) => clone(toggleToolbar(highlightNode(nd, false), undefined))));
    },
    [nodes, edges],
  );
}
