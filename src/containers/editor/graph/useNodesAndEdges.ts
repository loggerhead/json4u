import { useEffect, useState } from "react";
import { ViewMode } from "@/lib/db/config";
import { type EdgeWithData, type NodeWithData } from "@/lib/graph/layout";
import { useStatusStore } from "@/stores/statusStore";
import { useGraph, useTreeStore, useTreeVersion } from "@/stores/treeStore";
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
import { useResizeObserver } from "usehooks-ts";

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
  const count = useUserStore((state) => state.count);
  const usable = useUserStore((state) => state.usable("graphModeView"));
  const viewMode = useStatusStore((state) => state.viewMode);
  const setShowPricingOverlay = useStatusStore((state) => state.setShowPricingOverlay);
  const treeVersion = useTreeVersion();
  const setGraphSize = useTreeStore((state) => state.setGraphSize);
  const setGraphViewport = useTreeStore((state) => state.setGraphViewport);
  const { nodes: nextNodes, edges: nextEdges, levelMeta } = useGraph();

  const [version, setVersion] = useState(0);
  const [nodes, setNodes, onNodesChange] = useNodesState<NodeWithData>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<EdgeWithData>([]);

  useEffect(() => {
    if (viewMode === ViewMode.Graph && treeVersion > version) {
      if (usable) {
        setVersion(treeVersion);
        setNodes(nextNodes);
        setEdges(nextEdges);
        nextNodes.length > 0 && count("graphModeView");
      } else {
        setShowPricingOverlay(true);
      }
    }
  }, [usable, viewMode, treeVersion, version, nextNodes, nextEdges]);

  useResizeObserver({
    ref,
    onResize: ({ width, height }) => setGraphSize(width, height),
  });

  useOnViewportChange({
    onEnd: (viewport) => setGraphViewport(viewport),
  });

  return { nodes, edges, levelMeta, setNodes, setEdges, onNodesChange, onEdgesChange, version };
}
