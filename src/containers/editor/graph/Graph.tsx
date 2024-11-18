"use client";

import { useRef } from "react";
import { config } from "@/lib/graph/layout";
import { useStatusStore } from "@/stores/statusStore";
import { Background, Controls, OnConnectStart, ReactFlow, ReactFlowProvider } from "@xyflow/react";
import { type Node as FlowNode } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { debounce } from "lodash-es";
import MouseButton from "./MouseButton";
import { ObjectNode, RootNode, VirtualTargetNode } from "./Node";
import { useClearSearchHl, useRevealNode, useViewportChange } from "./useViewportChange";
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
  const setRevealPosition = useStatusStore((state) => state.setRevealPosition);
  const isTouchpad = useStatusStore((state) => state.isTouchpad);

  // The graph will render three times because:
  // 1. Modify text in the editor will cause `treeVersion` to change.
  // 2. A change in `treeVersion` will trigger the creation of a new graph, which will cause `nodes` to change.
  // 3. xyflow will measure the new `nodes`, which will trigger a render.
  const { nodes, edges, setNodes, setEdges, onNodesChange, onEdgesChange, translateExtent } = useVirtualGraph();
  useViewportChange(ref, setNodes, setEdges);
  useRevealNode(nodes, setNodes, setEdges);
  const clearSearchHl = useClearSearchHl();

  return (
    <ReactFlow
      ref={ref}
      panOnScroll={isTouchpad}
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
        clearSearchHl();

        (async () => {
          const { nodes, edges } = await window.worker.clearGraphNodeSelected();
          setNodes(nodes);
          setEdges(edges);
        })();
      }}
      onNodeClick={(_: React.MouseEvent, node: FlowNode) => {
        clearSearchHl(node.id);
        setRevealPosition({ treeNodeId: node.id, type: "node", from: "graphOthers" });

        (async () => {
          const { nodes, edges } = await window.worker.toggleGraphNodeSelected(node.id);
          setNodes(nodes);
          setEdges(edges);
        })();
      }}
      onConnectStart={(_: any, { nodeId, handleId, handleType }: Parameters<OnConnectStart>[1]) => {
        if (handleType === "target" || !(nodeId && handleId)) {
          return;
        }

        (async () => {
          const { nodes, edges } = await window.worker.toggleGraphNodeHidden(nodeId, handleId);
          setNodes(nodes);
          setEdges(edges);
        })();
      }}
      onError={onError}
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
        <MouseButton />
      </Controls>
      <Background />
    </ReactFlow>
  );
}

const print008Error = debounce((code: string, message: string) => console.error(message), 100, { leading: true });

const onError = (code: string, message: string) => {
  if (code === "008") {
    print008Error(code, message);
  } else {
    console.error(message);
  }
};
