import { useEffect, useRef } from "react";
import { ViewMode } from "@/lib/db/config";
import { config, initialViewport } from "@/lib/graph/layout";
import type { EdgeWithData, NodeWithData } from "@/lib/graph/types";
import { useEditorStore } from "@/stores/editorStore";
import { useStatusStore } from "@/stores/statusStore";
import { useTreeVersion } from "@/stores/treeStore";
import { useUserStore } from "@/stores/userStore";
import { useEdgesState, useNodesState, useReactFlow } from "@xyflow/react";
import { XYPosition } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { maxBy } from "lodash-es";
import { useShallow } from "zustand/react/shallow";

const viewportSize: [number, number] = [0, 0];

export default function useVirtualGraph() {
  const treeVersion = useTreeVersion();
  // nodes and edges are not all that are in the graph, but rather the ones that will be rendered.
  const [nodes, setNodes, onNodesChange] = useNodesState<NodeWithData>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<EdgeWithData>([]);

  const translateExtentRef = useRef<[[number, number], [number, number]]>([
    [-config.translateMargin, -config.translateMargin],
    [config.translateMargin, config.translateMargin],
  ]);

  const { setViewport, getZoom } = useReactFlow();
  const worker = useEditorStore((state) => state.worker);
  const { count, usable } = useUserStore(
    useShallow((state) => ({
      count: state.count,
      usable: state.usable("graphModeView"),
    })),
  );
  const { isGraphView, resetFoldStatus, setShowPricingOverlay } = useStatusStore(
    useShallow((state) => ({
      isGraphView: state.viewMode === ViewMode.Graph,
      resetFoldStatus: state.resetFoldStatus,
      setShowPricingOverlay: state.setShowPricingOverlay,
    })),
  );

  useEffect(() => {
    if (!(worker && isGraphView)) {
      console.log("Skip graph render:", !!worker, isGraphView, treeVersion);
      return;
    }

    if (!usable) {
      console.log("Skip graph render because reach out of free quota.");
      setShowPricingOverlay(true);
      return;
    }

    (async () => {
      const {
        graph: { levelMeta },
        renderable: { nodes, edges },
      } = await worker.createGraph();

      setNodes(nodes);
      setEdges(edges);
      setViewport({ ...initialViewport, zoom: getZoom() });
      resetFoldStatus();

      const [w, h] = viewportSize;
      const maxX = maxBy<XYPosition>(levelMeta, "x")?.x ?? 0;
      const maxY = maxBy<XYPosition>(levelMeta, "y")?.y ?? 0;

      translateExtentRef.current = [
        [-config.translateMargin, -config.translateMargin],
        // fix https://github.com/xyflow/xyflow/issues/3633
        [Math.max(maxX + config.translateMargin, w), Math.max(maxY + config.translateMargin, h)],
      ];

      console.log(
        "Create a new graph:",
        treeVersion,
        translateExtentRef.current,
        [nodes.length, edges.length],
        nodes.slice(0, 10),
        edges.slice(0, 10),
      );
      nodes.length > 0 && count("graphModeView");
    })();
  }, [worker, usable, isGraphView, treeVersion]);

  return {
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    translateExtent: translateExtentRef.current,
  };
}

export function setViewportSize(width: number, height: number) {
  if (width) {
    viewportSize[0] = width;
  }
  if (height) {
    viewportSize[1] = height;
  }
}
