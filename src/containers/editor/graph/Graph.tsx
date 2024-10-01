"use client";

import { useRef, useState } from "react";
import { config } from "@/lib/graph/layout";
import { detectOS } from "@/lib/utils";
import { Background, Controls, ReactFlow, ReactFlowProvider } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import DownloadButton from "./DownloadButton";
import MouseButton from "./MouseButton";
import { ObjectNode, RootNode, DummySourceNode, DummyTargetNode } from "./Node";
import { useHandleClick } from "./useHandleClick";
import { useNodeClick } from "./useNodeClick";
import useNodesAndEdges from "./useNodesAndEdges";
import useRevealNode from "./useRevealNode";
import useViewportChange from "./useViewportChange";

export default function Graph() {
  return (
    <div className="relative w-full h-full">
      <ReactFlowProvider>
        <LayoutGraph />
      </ReactFlowProvider>
    </div>
  );
}

function LayoutGraph() {
  const [isTouchPad, setIsTouchPad] = useState(detectOS() === "Mac");

  const ref = useRef<HTMLDivElement>(null);
  const nodesAndEdges = useNodesAndEdges();
  const { onMouseClickNode } = useNodeClick(nodesAndEdges);
  const { onMouseClickHandle } = useHandleClick(nodesAndEdges);

  useViewportChange(ref, nodesAndEdges);
  useRevealNode(nodesAndEdges);

  return (
    <ReactFlow
      ref={ref}
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
        dummySource: DummySourceNode,
        dummyTarget: DummyTargetNode,
      }}
      defaultEdgeOptions={{
        selectable: false,
        focusable: false,
        deletable: false,
      }}
      // TODO: waiting fix https://github.com/xyflow/xyflow/issues/3633
      // translateExtent={translateExtent}
      onNodeClick={onMouseClickNode}
      onConnectStart={onMouseClickHandle}
      nodesDraggable={false}
      nodesConnectable={false}
      connectOnClick={false}
      deleteKeyCode={null}
      selectionKeyCode={null}
      multiSelectionKeyCode={null}
      {...nodesAndEdges}
    >
      <Controls showInteractive={false}>
        <MouseButton isTouchPad={isTouchPad} setIsTouchPad={setIsTouchPad} />
        <DownloadButton />
      </Controls>
      <Background />
    </ReactFlow>
  );
}
