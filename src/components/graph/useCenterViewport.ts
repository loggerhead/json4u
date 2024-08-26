import { useEffect } from "react";
import { config, globalStyle } from "@/lib/graph/layout";
import { getNodesBounds, useReactFlow, useStoreApi } from "@xyflow/react";
import { NodesAndEdges } from "./useNodesAndEdges";

// center and scale viewport to include nodes as much as possible
export default function useCenterViewport({ nodes, version }: NodesAndEdges, autoZoom: boolean) {
  const store = useStoreApi();
  const { setViewport, getZoom } = useReactFlow();

  useEffect(() => {
    let zoom = 0;

    if (autoZoom) {
      const { width, height } = store.getState();
      const bounds = getNodesBounds(nodes);
      // The formula for zoom is copied from the source code of getViewportForBounds.
      const xZoom = width / bounds.width;
      const yZoom = height / bounds.height;
      zoom = Math.min(Math.max(Math.min(xZoom, yZoom), config.minZoom), config.maxZoom);
    } else {
      zoom = getZoom();
    }

    setViewport({ x: globalStyle.nodeGap, y: globalStyle.nodeGap, zoom });
  }, [version]);
}
