import { useCallback, type MouseEvent } from "react";
import type { EdgeWithData, NodeWithData, RevealFrom, RevealType } from "@/lib/graph/types";
import { getGraphNodeId } from "@/lib/graph/utils";
import { useStatusStore } from "@/stores/statusStore";
import { useReactFlow } from "@xyflow/react";

/**
 * Custom hook to handle node click events in the graph.
 * Returns a callback function that can be used to process node click actions.
 *
 * @returns A callback function that handles node click events.
 */
export default function useClickNode() {
  const { setNodes, setEdges } = useReactFlow<NodeWithData, EdgeWithData>();
  // Get the function to set the reveal position from the status store
  const setRevealPosition = useStatusStore((state) => state.setRevealPosition);

  /**
   * Callback function to handle node click events.
   * Sets the reveal position, and toggles the selected state of the corresponding graph node.
   *
   * @param e - The mouse event triggered by the click.
   * @param treeNodeId - The ID of the clicked tree node.
   * @param type - The type of reveal action.
   * @param from - The source of the reveal action, defaults to "graph".
   */
  return useCallback(
    async (e: MouseEvent, treeNodeId: string, type: RevealType, from: RevealFrom = "graph") => {
      e.stopPropagation();
      setRevealPosition({ treeNodeId, type, from });
      const graphNodeId = getGraphNodeId(treeNodeId, type);

      // Toggle the selected state of the graph node and get the updated nodes and edges
      const { nodes, edges } = await window.worker.toggleGraphNodeSelected(graphNodeId, treeNodeId);
      setNodes(nodes);
      setEdges(edges);
    },
    [setRevealPosition, setNodes, setEdges],
  );
}
