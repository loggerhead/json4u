"use client";

import * as React from "react";
import { useEffect } from "react";
import { config, globalStyle } from "@/lib/graph/layout";
import { Background, Controls, ReactFlow, ReactFlowProvider } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import DownloadButton from "./DownloadButton";
import ObjectNode from "./ObjectNode";
import RootNode from "./RootNode";
import useCenterViewport from "./useCenterViewport";
import { useHandleClick } from "./useHandleClick";
import { useNodeClick } from "./useNodeClick";
import useNodesAndEdges from "./useNodesAndEdges";
import { usePaneClick } from "./usePaneClick";
import useRevealNode from "./useRevealNode";
import { px2num } from "@/lib/utils";

export default function Graph() {
  return (
    <div className="relative w-full h-full">
      <WidthMeasure />
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

  useCenterViewport(nodesAndEdges, false);
  useRevealNode(nodesAndEdges);

  return (
    <ReactFlow
      panOnScroll
      onlyRenderVisibleElements
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
        <DownloadButton />
      </Controls>
      <Background />
    </ReactFlow>
  );
}

function WidthMeasure() {
  useEffect(() => {
    const el = document.getElementById("width-measure")!;
    const span = el.querySelector("span")!;
    const { lineHeight } = getComputedStyle(span);
    const { borderWidth } = getComputedStyle(el);
    const { paddingLeft, paddingRight } = getComputedStyle(el.querySelector(".graph-kv")!);
    const { marginRight, maxWidth: maxKeyWidth } = getComputedStyle(el.querySelector(".graph-k")!);
    const { maxWidth: maxValueWidth } = getComputedStyle(el.querySelector(".graph-v")!);

    globalStyle.fontWidth = span.offsetWidth / span.textContent!.length;
    globalStyle.kvHeight = px2num(lineHeight);
    globalStyle.padding = px2num(paddingLeft) + px2num(paddingRight);
    globalStyle.borderWidth = px2num(borderWidth);
    globalStyle.kvGap = px2num(marginRight);
    globalStyle.maxKeyWidth = px2num(maxKeyWidth);
    globalStyle.maxValueWidth = px2num(maxValueWidth);
  }, []);

  return (
    <div id="width-measure" className="absolute invisible graph-node">
      <div className="graph-kv">
        <div className="graph-k">
          <span>{"measure"}</span>
        </div>
        <div className="graph-v" />
      </div>
    </div>
  );
}
