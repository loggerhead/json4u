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
    },
    refreshInterval,
    [worker, setNodes, setEdges],
  );

  useResizeObserver({ ref, onResize });
  useOnViewportChange({ onChange: onViewportChange });
}

export function useRevealNode(nodes: NodeWithData[], edges: EdgeWithData[]) {
  const { getZoom, setCenter } = useReactFlow();
  const worker = useEditorStore((state) => state.worker)!;
  const revealPosition = useStatusStore((state) => state.revealPosition);
  const highlightRevealPosition = useStatusStore((state) => state.highlightRevealPosition);

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

  useEffect(() => {
    // Every time nodes are set, it will cause the graph to render twice.
    // We need to highlight after the second render. Otherwise, the highlight will not take effect.
    // The first render will not set `node.measured`, but the second render will.
    // So we can check `node.measured` to know whether it is the second render.
    if (revealPosition.treeNodeId && nodes?.[0]?.measured?.width) {
      highlightRevealPosition();
    }
  }, [nodes, edges]);
}
