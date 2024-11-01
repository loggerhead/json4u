import { type Dispatch, type RefObject, type SetStateAction, useEffect } from "react";
import type { EdgeWithData, NodeWithData } from "@/lib/graph/types";
import { refreshInterval } from "@/lib/graph/virtual";
import { useDebounceFn } from "@/lib/hooks";
import { useEditorStore } from "@/stores/editorStore";
import { useStatusStore } from "@/stores/statusStore";
import { useOnViewportChange, useReactFlow } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useResizeObserver } from "usehooks-ts";
import { setViewportSize } from "./useVirtualGraph";

export function useViewportChange(
  ref: RefObject<HTMLDivElement>,
  setNodes: Dispatch<SetStateAction<NodeWithData[]>>,
  setEdges: Dispatch<SetStateAction<EdgeWithData[]>>,
) {
  const worker = useEditorStore((state) => state.worker);
  const highlightRevealPosition = useStatusStore((state) => state.highlightRevealPosition);

  const onResize = useDebounceFn(
    async ({ width, height }) => {
      if (!(worker && width && height)) {
        return;
      }

      const {
        renderable: { nodes, edges },
        changed,
      } = await worker.setGraphSize(width, height);

      console.log(
        "Compute virtual graph because of resize:",
        changed,
        [width, height],
        [nodes.length, edges.length],
        nodes.slice(0, 10),
        edges.slice(0, 10),
      );

      setViewportSize(width, height);
      if (changed) {
        setNodes(nodes);
        setEdges(edges);
      }
    },
    refreshInterval,
    [worker, setNodes, setEdges],
  );

  const onViewportChange = useDebounceFn(
    async (viewport) => {
      if (!worker) {
        return;
      }

      const {
        renderable: { nodes, edges },
        changed,
      } = await worker.setGraphViewport(viewport);

      console.log(
        "Compute virtual graph because of viewport changed:",
        changed,
        viewport,
        [nodes.length, edges.length],
        nodes.slice(0, 10),
        edges.slice(0, 10),
      );

      if (changed) {
        setNodes(nodes);
        setEdges(edges);
      }
      highlightRevealPosition();
    },
    refreshInterval,
    [worker, setNodes, setEdges, highlightRevealPosition],
  );

  useResizeObserver({ ref, onResize });
  useOnViewportChange({ onChange: onViewportChange });
}

export function useRevealNode() {
  const { getZoom, setCenter } = useReactFlow();
  const worker = useEditorStore((state) => state.worker)!;
  const revealPosition = useStatusStore((state) => state.revealPosition);

  useEffect(() => {
    if (worker && revealPosition.treeNodeId) {
      (async () => {
        const { x, y, changed } = await worker.computeGraphRevealPosition(revealPosition);

        if (changed) {
          setCenter(x, y, { duration: 100, zoom: getZoom() });
        }
      })();
    }
  }, [worker, revealPosition]);
}
