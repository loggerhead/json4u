import { useEffect, useRef } from "react";
import { useCallback } from "react";
import { ViewMode } from "@/lib/db/config";
import { config, globalStyle, type EdgeWithData, type NodeWithData } from "@/lib/graph/layout";
import { clone } from "@/lib/utils";
import { useEditorStore } from "@/stores/editorStore";
import { useStatusStore } from "@/stores/statusStore";
import { useTreeVersion } from "@/stores/treeStore";
import { useUserStore } from "@/stores/userStore";
import { OnEdgesChange, OnNodesChange, useEdgesState, useNodesState, useReactFlow } from "@xyflow/react";
import { XYPosition } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { maxBy } from "lodash-es";
import { useShallow } from "zustand/react/shallow";
import { highlightEdge, highlightNode, toggleToolbar } from "./utils";

const viewportSize = [0, 0];

export interface NodesAndEdges {
  nodes: NodeWithData[];
  edges: EdgeWithData[];
  setNodes: (nodes: NodeWithData[]) => void;
  setEdges: (edges: EdgeWithData[]) => void;
  onNodesChange?: OnNodesChange<NodeWithData>;
  onEdgesChange?: OnEdgesChange<EdgeWithData>;
}

export default function useNodesAndEdges() {
  const treeVersion = useTreeVersion();
  // nodes and edges are not all that are in the graph, but rather the ones that will be rendered.
  const [nodes, setNodes, onNodesChange] = useNodesState<NodeWithData>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<EdgeWithData>([]);

  const versionRef = useRef(0);
  const translateExtentRef = useRef<[[number, number], [number, number]]>([
    [0, 0],
    [0, 0],
  ]);

  const { setViewport, getZoom } = useReactFlow();
  const worker = useEditorStore((state) => state.worker);
  const { count, usable } = useUserStore(
    useShallow((state) => ({
      count: state.count,
      usable: state.usable("graphModeView"),
    })),
  );
  const { isGraphView, setShowPricingOverlay } = useStatusStore(
    useShallow((state) => ({
      isGraphView: state.viewMode === ViewMode.Graph,
      setShowPricingOverlay: state.setShowPricingOverlay,
    })),
  );

  useEffect(() => {
    if (!(worker && isGraphView && treeVersion > versionRef.current)) {
      return;
    }

    if (!usable) {
      setShowPricingOverlay(true);
      return;
    }

    (async () => {
      const {
        graph: { levelMeta },
        visible: { nodes, edges },
      } = await worker.createGraph();
      setNodes(nodes);
      setEdges(edges);
      setViewport({ x: globalStyle.nodeGap, y: globalStyle.nodeGap, zoom: getZoom() });

      versionRef.current = treeVersion;
      const maxX = maxBy<XYPosition>(levelMeta, "x")?.x;
      const maxY = maxBy<XYPosition>(levelMeta, "y")?.y;

      if (maxX && maxY) {
        translateExtentRef.current = [
          [-config.translateMargin, -config.translateMargin],
          [
            // fix https://github.com/xyflow/xyflow/issues/3633
            Math.max(maxX + config.translateMargin, viewportSize[0]),
            Math.max(maxY + config.translateMargin, viewportSize[1]),
          ],
        ];
      }

      nodes.length > 0 && count("graphModeView");
    })();
  }, [worker, usable, isGraphView, treeVersion]);

  // clear all animated for edges
  const onPaneClick = useCallback(
    (_: React.MouseEvent) => {
      setEdges(edges.map((ed) => clone(highlightEdge(ed, false))));
      setNodes(nodes.map((nd) => clone(toggleToolbar(highlightNode(nd, false), undefined))));
    },
    [nodes, edges],
  );

  return {
    nodes,
    edges,
    setNodes,
    setEdges,
    onNodesChange,
    onEdgesChange,
    onPaneClick,
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
