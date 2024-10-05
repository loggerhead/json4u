"use client";

import { useRef, useState } from "react";
import { config } from "@/lib/graph/layout";
import { detectOS } from "@/lib/utils";
import { Background, Controls, ReactFlow, ReactFlowProvider } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import MouseButton from "./MouseButton";
import { ObjectNode, RootNode, DummyTargetNode } from "./Node";
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
  const r = useNodesAndEdges();
  const { onMouseClickNode } = useNodeClick(r);
  const { onMouseClickHandle } = useHandleClick(r);

  useViewportChange(ref, r);
  useRevealNode(r);

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
        dummyTarget: DummyTargetNode,
      }}
      defaultEdgeOptions={{
        selectable: false,
        focusable: false,
        deletable: false,
      }}
      // TODO: waiting fix https://github.com/xyflow/xyflow/issues/3633
      // translateExtent={r.translateExtent}
      onNodeClick={onMouseClickNode}
      onConnectStart={onMouseClickHandle}
      nodes={r.nodes}
      edges={r.edges}
      onNodesChange={r.onNodesChange}
      onEdgesChange={r.onEdgesChange}
      onPaneClick={r.onPaneClick}
      nodesDraggable={false}
      nodesConnectable={false}
      connectOnClick={false}
      deleteKeyCode={null}
      selectionKeyCode={null}
      multiSelectionKeyCode={null}
    >
      <Controls showInteractive={false}>
        <MouseButton isTouchPad={isTouchPad} setIsTouchPad={setIsTouchPad} />
      </Controls>
      <Background />
    </ReactFlow>
  );
}
