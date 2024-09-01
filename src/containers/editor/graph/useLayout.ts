import { useEffect } from "react";
import { Layouter, globalStyle } from "@/lib/graph/layout";
import { useTree } from "@/stores/treeStore";
import { NodesAndEdges } from "./useNodesAndEdges";

export default function useLayout({ nodes, setNodes }: NodesAndEdges) {
  const tree = useTree();
  const isMeasured = nodes.length > 0 && !!nodes[nodes.length - 1].measured?.width;

  useEffect(() => {
    if (isMeasured) {
      const { ordered } = new Layouter(globalStyle, tree, nodes).layout();
      setNodes([...ordered]);
    }
  }, [isMeasured]);
}
