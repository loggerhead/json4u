import { useEffect } from "react";
import { useStatusStore } from "@/stores/statusStore";
import { useReactFlow } from "@xyflow/react";
import { NodesAndEdges } from "./useNodesAndEdges";

export default function useRevealNode({ nodes }: NodesAndEdges) {
  const { getZoom, setCenter } = useReactFlow();
  const { id, version } = useStatusStore((state) => state.revealId);

  useEffect(() => {
    const node = nodes.find((node) => node.id === id);

    if (node && node.measured?.width && node.measured?.height) {
      const x = node.position.x + node.measured.width / 2;
      const y = node.position.y + node.measured.height / 2;
      setCenter(x, y, { duration: 100, zoom: getZoom() });
    }
  }, [id, version]);
}
