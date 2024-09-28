"use client";

import * as React from "react";
import { useState } from "react";
import { config } from "@/lib/graph/layout";
import { Background, Controls, ReactFlow, ReactFlowProvider } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import DownloadButton from "./DownloadButton";
import MouseButton from "./MouseButton";
import ObjectNode from "./ObjectNode";
import RootNode from "./RootNode";
import useCenterViewport from "./useCenterViewport";
import { useHandleClick } from "./useHandleClick";
import { useNodeClick } from "./useNodeClick";
import useNodesAndEdges from "./useNodesAndEdges";
import { usePaneClick } from "./usePaneClick";
import useRevealNode from "./useRevealNode";

export default function Graph() {
  return (
    <div className="relative w-full h-full">
      <ReactFlowProvider>
        <LayoutGraph />
      </ReactFlowProvider>
    </div>
  );
}

// TODO: 支持搜索 https://www.fusejs.io/demo.html
// TODO: lazy loading nodes using intersection observer and requestAnimationFrame to improve performance
function LayoutGraph() {
  const nodesAndEdges = useNodesAndEdges();
  const onPaneClick = usePaneClick(nodesAndEdges);
  const { onMouseClickNode } = useNodeClick(nodesAndEdges);
  const { onMouseClickHandle } = useHandleClick(nodesAndEdges);
  const [isTouchPad, setIsTouchPad] = useState(detectOS() === "Mac");

  useCenterViewport(nodesAndEdges, false);
  useRevealNode(nodesAndEdges);

  return (
    <ReactFlow
      onlyRenderVisibleElements
      panOnScroll={isTouchPad}
      panOnScrollSpeed={config.panOnScrollSpeed}
      minZoom={config.minZoom}
      maxZoom={config.maxZoom}
      reconnectRadius={config.reconnectRadius}
      colorMode={config.colorMode}
      attributionPosition={config.attributionPosition}
      nodeTypes={{
        object: ObjectNode,
        root: RootNode,
      }}
      defaultEdgeOptions={{
        selectable: false,
        focusable: false,
        deletable: false,
      }}
      // TODO: waiting fix https://github.com/xyflow/xyflow/issues/3633
      // translateExtent={translateExtent}
      nodes={nodesAndEdges.nodes}
      edges={nodesAndEdges.edges}
      onNodesChange={nodesAndEdges.onNodesChange}
      onEdgesChange={nodesAndEdges.onEdgesChange}
      onPaneClick={onPaneClick}
      onNodeClick={onMouseClickNode}
      onConnectStart={onMouseClickHandle}
      nodesDraggable={false}
      nodesConnectable={false}
      connectOnClick={false}
      deleteKeyCode={null}
      selectionKeyCode={null}
      multiSelectionKeyCode={null}
    >
      <Controls showInteractive={false}>
        <MouseButton isTouchPad={isTouchPad} setIsTouchPad={setIsTouchPad} />
        <DownloadButton />
      </Controls>
      <Background />
    </ReactFlow>
  );
}

function detectOS() {
  // if a browser has no support for navigator.userAgentData.platform use platform as fallback
  // @ts-ignore
  const userAgent = (navigator.userAgentData?.platform ?? (navigator.platform || navigator.userAgent)).toLowerCase();

  if (userAgent.includes("win")) {
    return "Windows";
  } else if (userAgent.includes("android")) {
    return "Android";
  } else if (userAgent.includes("mac")) {
    return "Mac";
  } else if (userAgent.includes("iphone") || userAgent.includes("ipad")) {
    return "iOS";
  } else if (userAgent.includes("linux")) {
    return "Linux";
  }

  return "Unknown OS";
}
