"use client";

import { useRef, useState } from "react";
import { config } from "@/lib/graph/layout";
import { detectOS } from "@/lib/utils";
import { useEditorStore } from "@/stores/editorStore";
import { useStatusStore } from "@/stores/statusStore";
import { Background, Controls, OnConnectStart, ReactFlow, ReactFlowProvider, useReactFlow } from "@xyflow/react";
import { type Node as FlowNode } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useDebounceCallback } from "usehooks-ts";
import MouseButton from "./MouseButton";
import { ObjectNode, RootNode, VirtualTargetNode } from "./Node";
import { useViewportChange, useRevealNode } from "./useViewportChange";
import useVirtualGraph from "./useVirtualGraph";

export default function Graph() {
  return (
    <div className="relative w-full h-full">
      <ReactFlowProvider>
        <LayoutGraph />
      </ReactFlowProvider>
    </div>
  );
}

// TODO: why is this render three times?
function LayoutGraph() {
  const ref = useRef<HTMLDivElement>(null);
  const onPaneClick = useOnPaneClick();
  const onNodeClick = useOnNodeClick();
  const onHandleClick = useOnHandleClick();

  const [isTouchPad, setIsTouchPad] = useState(detectOS() === "Mac");
  const g = useVirtualGraph();
  useViewportChange(ref);
  useRevealNode();

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
        virtualTarget: VirtualTargetNode,
      }}
      defaultEdgeOptions={{
        selectable: false,
        focusable: false,
        deletable: false,
      }}
      translateExtent={g.translateExtent}
      onPaneClick={onPaneClick}
      onNodeClick={onNodeClick}
      onConnectStart={onHandleClick}
      nodes={g.nodes}
      edges={g.edges}
      onNodesChange={g.onNodesChange}
      onEdgesChange={g.onEdgesChange}
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

function useOnNodeClick() {
  const { setNodes, setEdges } = useReactFlow();
  const worker = useEditorStore((state) => state.worker);
  const setJsonPath = useStatusStore((state) => state.setJsonPath);

  return useDebounceCallback(
    (_: React.MouseEvent, node: FlowNode) => {
      if (!worker) {
        return;
      }

      (async () => {
        const { nodes, edges, jsonPath } = await worker.toggleGraphNodeSelected(node.id);
        setNodes(nodes);
        setEdges(edges);
        setJsonPath(jsonPath);
      })();
    },
    10,
    { trailing: true },
  );
}

function useOnHandleClick() {
  const { setNodes, setEdges } = useReactFlow();
  const worker = useEditorStore((state) => state.worker);

  return useDebounceCallback(
    (_: any, { nodeId, handleId, handleType }: Parameters<OnConnectStart>[1]) => {
      if (handleType === "target" || !(worker && nodeId && handleId)) {
        return;
      }

      (async () => {
        const { nodes, edges } = await worker.toggleGraphNodeHidden(nodeId, handleId);
        setNodes(nodes);
        setEdges(edges);
      })();
    },
    10,
    { trailing: true },
  );
}

// clear all animated for edges
function useOnPaneClick() {
  const { setNodes, setEdges } = useReactFlow();
  const worker = useEditorStore((state) => state.worker);

  return useDebounceCallback(
    (_: React.MouseEvent) => {
      if (!worker) {
        return;
      }

      (async () => {
        const { nodes, edges } = await worker.clearGraphNodeSelected();
        setNodes(nodes);
        setEdges(edges);
      })();
    },
    10,
    { trailing: true },
  );
}
