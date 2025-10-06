import { useCallback, type MouseEvent } from "react";
import type { EdgeWithData, NodeWithData, RevealFrom, RevealType } from "@/lib/graph/types";
import { clearHighlight } from "@/lib/graph/utils";
import { getParentId } from "@/lib/idgen/pointer";
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
  // Get the function to clear the search highlight
  const clearSearchHl = useClearSearchHl();

  /**
   * Callback function to handle node click events.
   *
   * @param e - The mouse event triggered by the click.
   * @param id - The ID of the clicked node.
   * @param type - The type of reveal action.
   * @param from - The source of the reveal action, defaults to "graph".
   */
  return useCallback(
    async (e: MouseEvent, id: string, type: RevealType, from: RevealFrom = "graph") => {
      // Stop the event from propagating to parent elements
      e.stopPropagation();
      // Clear the search highlight
      clearSearchHl();
      // Set the reveal position based on the clicked node
      setRevealPosition({
        treeNodeId: id,
        type,
        from,
      });

      // Get the parent ID of the clicked node
      const parentId = getParentId(id);
      // Toggle the selected state of the graph node and get the updated nodes and edges
      const { nodes, edges } = await window.worker.toggleGraphNodeSelected(parentId, id);
      setNodes(nodes);
      setEdges(edges);
    },
    [clearSearchHl, setRevealPosition, setNodes, setEdges],
  );
}

// clear highlight of search result
export function useClearSearchHl() {
  const revealPosition = useStatusStore((state) => state.revealPosition);

  return useCallback(
    (nodeId?: string) => {
      const isCurrentNode =
        revealPosition.type === "node"
          ? nodeId === revealPosition.treeNodeId
          : nodeId === getParentId(revealPosition.treeNodeId);

      if (!isCurrentNode) {
        clearHighlight();
      }
    },
    [revealPosition],
  );
}
