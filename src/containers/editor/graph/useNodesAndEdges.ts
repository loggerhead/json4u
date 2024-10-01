import { useCallback, useEffect, useState } from "react";
import { ViewMode } from "@/lib/db/config";
import { type EdgeWithData, type NodeWithData } from "@/lib/graph/layout";
import { useEditorStore } from "@/stores/editorStore";
import { useStatusStore } from "@/stores/statusStore";
import { useTreeVersion } from "@/stores/treeStore";
import { useUserStore } from "@/stores/userStore";
import {
  OnEdgesChange,
  OnNodesChange,
  useEdgesState,
  useNodesState,
  useOnViewportChange,
  XYPosition,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { debounce } from "lodash-es";
import { useResizeObserver } from "usehooks-ts";
import { useShallow } from "zustand/react/shallow";

export interface NodesAndEdges {
  nodes: NodeWithData[];
  edges: EdgeWithData[];
  setNodes: (nodes: NodeWithData[]) => void;
  setEdges: (edges: EdgeWithData[]) => void;
  onNodesChange?: OnNodesChange<NodeWithData>;
  onEdgesChange?: OnEdgesChange<EdgeWithData>;
  levelMeta?: XYPosition[];
  version?: number;
}

export default function useNodesAndEdges(ref: React.RefObject<HTMLDivElement>): NodesAndEdges {
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
  const worker = useEditorStore((state) => state.worker);
  const treeVersion = useTreeVersion();

  const [version, setVersion] = useState(0);
  const [levelMeta, setLevelMeta] = useState<XYPosition[]>();
  const [nodes, setNodes, onNodesChange] = useNodesState<NodeWithData>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<EdgeWithData>([]);

  useEffect(() => {
    if (!(worker && isGraphView && treeVersion > version)) {
      return;
    }

    if (!usable) {
      setShowPricingOverlay(true);
      return;
    }

    (async () => {
      const { nodes, edges, levelMeta } = await worker.createGraph();
      setNodes(nodes);
      setEdges(edges);
      setLevelMeta(levelMeta);
      setVersion(treeVersion);
      nodes.length > 0 && count("graphModeView");
    })();
  }, [worker, usable, isGraphView, treeVersion, version]);

  const onResize = useCallback(
    debounce(({ width, height }) => worker?.setGraphSize(width, height), 250, { trailing: true }),
    [worker],
  );

  const onViewportChange = useCallback(
    debounce((viewport) => worker?.setGraphViewport(viewport), 250, { trailing: true }),
    [worker],
  );

  useResizeObserver({ ref, onResize });
  useOnViewportChange({ onEnd: onViewportChange });

  return {
    nodes,
    edges,
    levelMeta,
    setNodes,
    setEdges,
    onNodesChange,
    onEdgesChange,
    version,
  };
}
