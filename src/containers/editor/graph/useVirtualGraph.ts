import { useEffect, useRef } from "react";
import { ViewMode } from "@/lib/db/config";
import { config } from "@/lib/graph/layout";
import type { EdgeWithData, NodeWithData } from "@/lib/graph/types";
import { useStatusStore } from "@/stores/statusStore";
import { useTreeMeta } from "@/stores/treeStore";
import { useUserStore } from "@/stores/userStore";
import { useEdgesState, useNodesState, useReactFlow } from "@xyflow/react";
import { XYPosition } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { maxBy } from "lodash-es";
import { useShallow } from "zustand/shallow";

const viewportSize: [number, number] = [0, 0];

export default function useVirtualGraph() {
  const { version: treeVersion, needReset } = useTreeMeta();
  // nodes and edges are not all that are in the graph, but rather the ones that will be rendered.
  const [nodes, setNodes, onNodesChange] = useNodesState<NodeWithData>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<EdgeWithData>([]);

  const translateExtentRef = useRef<[[number, number], [number, number]]>([
    [-config.translateMargin, -config.translateMargin],
    [config.translateMargin, config.translateMargin],
  ]);

  const { setViewport } = useReactFlow();
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
    if (!(window.worker && isGraphView)) {
      console.l("skip graph render:", isGraphView, treeVersion);
      return;
    }

    if (!usable) {
      console.l("skip graph render because reach out of free quota.");
      setShowPricingOverlay(true);
      return;
    }

    (async () => {
      const {
        graph: { levelMeta },
        renderable: { nodes, edges },
        viewport,
      } = await window.worker.createGraph(needReset);

      setNodes(nodes);
      setEdges(edges);

      if (needReset) {
        setViewport(viewport);
        resetFoldStatus();
      }

      const [w, h] = viewportSize;
      const px = Math.max(config.translateMargin, w / 2);
      const py = Math.max(config.translateMargin, h / 2);
      const maxX = maxBy<XYPosition>(levelMeta, "x")?.x ?? 0;
      const maxY = maxBy<XYPosition>(levelMeta, "y")?.y ?? 0;

      // fix https://github.com/xyflow/xyflow/issues/3633
      translateExtentRef.current = [
        [-px, -py],
        [maxX + px, maxY + py],
      ];

      console.l(
        "create a new graph:",
        treeVersion,
        translateExtentRef.current,
        nodes.length,
        edges.length,
        nodes.slice(0, 10),
        edges.slice(0, 10),
      );
      nodes.length > 0 && count("graphModeView");
    })();
  }, [usable, isGraphView, treeVersion, needReset]);

  return {
    nodes,
    edges,
    setNodes,
    setEdges,
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
