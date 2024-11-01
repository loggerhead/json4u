"use client";

import { useRef, useState } from "react";
import { config } from "@/lib/graph/layout";
import { clearHighlight } from "@/lib/graph/utils";
import { detectOS } from "@/lib/utils";
import { useEditorStore } from "@/stores/editorStore";
import { useStatusStore } from "@/stores/statusStore";
import { Background, Controls, OnConnectStart, ReactFlow, ReactFlowProvider } from "@xyflow/react";
import { type Node as FlowNode } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import MouseButton from "./MouseButton";
import { ObjectNode, RootNode, VirtualTargetNode } from "./Node";
import { useRevealNode, useViewportChange } from "./useViewportChange";
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

function LayoutGraph() {
  const ref = useRef<HTMLDivElement>(null);
  const worker = useEditorStore((state) => state.worker);
  const setJsonPath = useStatusStore((state) => state.setJsonPath);
  const [isTouchPad, setIsTouchPad] = useState(detectOS() === "Mac");

  // The graph will render three times because:
  // 1. Modify text in the editor will cause `treeVersion` to change.
  // 2. A change in `treeVersion` will trigger the creation of a new graph, which will cause `nodes` to change.
  // 3. xyflow will measure the new `nodes`, which will trigger a render.
  const { nodes, edges, setNodes, setEdges, onNodesChange, onEdgesChange, translateExtent } = useVirtualGraph();
  useViewportChange(ref, setNodes, setEdges);
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
      translateExtent={translateExtent}
      // clear all animated for edges
      onPaneClick={(_: React.MouseEvent) => {
        if (!worker) {
          return;
        }

        clearHighlight();

        (async () => {
          const { nodes, edges } = await worker.clearGraphNodeSelected();
          setNodes(nodes);
          setEdges(edges);
        })();
      }}
      onNodeClick={(_: React.MouseEvent, node: FlowNode) => {
        if (!worker) {
          return;
        }

        (async () => {
          const { nodes, edges, jsonPath } = await worker.toggleGraphNodeSelected(node.id);
          setNodes(nodes);
          setEdges(edges);
          setJsonPath(jsonPath);
        })();
      }}
      onConnectStart={(_: any, { nodeId, handleId, handleType }: Parameters<OnConnectStart>[1]) => {
        if (handleType === "target" || !(worker && nodeId && handleId)) {
          return;
        }

        (async () => {
          const { nodes, edges } = await worker.toggleGraphNodeHidden(nodeId, handleId);
          setNodes(nodes);
          setEdges(edges);
        })();
      }}
      nodes={nodes}
      edges={edges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
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
