"use client";

import { useRef, useState } from "react";
import { config } from "@/lib/graph/layout";
import { clearSearchHighlight } from "@/lib/graph/utils";
import { detectOS } from "@/lib/utils";
import { useEditorStore } from "@/stores/editorStore";
import { useStatusStore } from "@/stores/statusStore";
import { Background, Controls, OnConnectStart, ReactFlow, ReactFlowProvider, useReactFlow } from "@xyflow/react";
import { type Node as FlowNode } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
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
  const worker = useEditorStore((state) => state.worker);
  const setJsonPath = useStatusStore((state) => state.setJsonPath);
  const [isTouchPad, setIsTouchPad] = useState(detectOS() === "Mac");
  const { setNodes, setEdges } = useReactFlow();
  const g = useVirtualGraph();

  useViewportChange(ref);
  useRevealNode();

  console.log("graph render");

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
      // clear all animated for edges
      onPaneClick={(_: React.MouseEvent) => {
        if (!worker) {
          return;
        }

        clearSearchHighlight();

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
