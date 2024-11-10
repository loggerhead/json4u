import { type Dispatch, type RefObject, type SetStateAction, useEffect, useState } from "react";
import type { EdgeWithData, NodeWithData } from "@/lib/graph/types";
import { refreshInterval } from "@/lib/graph/virtual";
import { useDebounceFn } from "@/lib/hooks";
import { useStatusStore } from "@/stores/statusStore";
import { useOnViewportChange, useReactFlow } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { keyBy } from "lodash-es";
import { useResizeObserver } from "usehooks-ts";
import { setViewportSize } from "./useVirtualGraph";

export function useViewportChange(
  ref: RefObject<HTMLDivElement>,
  setNodes: Dispatch<SetStateAction<NodeWithData[]>>,
  setEdges: Dispatch<SetStateAction<EdgeWithData[]>>,
) {
  const onResize = useDebounceFn(
    async ({ width, height }) => {
      if (!(width && height)) {
        return;
      }

      const {
        renderable: { nodes, edges },
        changed,
      } = await window.worker.setGraphSize(width, height);

      console.l(
        "compute virtual graph since resize:",
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
    [setNodes, setEdges],
  );

  const onViewportChange = useDebounceFn(
    // the x,y values of the viewport aren't technically coordinates,
    // they are values used to apply a transformation to the viewport.
    // https://github.com/xyflow/xyflow/discussions/4311#discussioncomment-9602692
    async ({ x, y, zoom }) => {
      const viewport = { x: -x, y: -y, zoom };
      const {
        renderable: { nodes, edges },
        changed,
      } = await window.worker.setGraphViewport(viewport);

      if (changed) {
        console.l("compute virtual graph since the viewport has changed:", viewport, nodes.length, nodes.slice(0, 10));
        setNodes(nodes);
        setEdges(edges);
      }
    },
    refreshInterval,
    [setNodes, setEdges],
  );

  useResizeObserver({ ref, onResize });
  useOnViewportChange({ onChange: onViewportChange });
}

export function useRevealNode(
  nodes: NodeWithData[],
  setNodes: Dispatch<SetStateAction<NodeWithData[]>>,
  setEdges: Dispatch<SetStateAction<EdgeWithData[]>>,
) {
  const { getZoom, setCenter } = useReactFlow();
  const revealPosition = useStatusStore((state) => state.revealPosition);
  const hlRevealPosition = useStatusStore((state) => state.hlRevealPosition);

  const [waitToMeasure, setWaitToMeasure] = useState<string[]>([]);
  const nodesMap = keyBy(nodes, "id");
  const isMeasured = waitToMeasure.length && waitToMeasure.every((id) => nodesMap[id]?.measured?.width);

  useEffect(() => {
    if (revealPosition.treeNodeId) {
      (async () => {
        const r = await window.worker.computeGraphRevealPosition(revealPosition);
        if (!r) {
          return;
        }

        const { center, viewport } = r;
        const zoom = getZoom();

        const {
          renderable: { nodes, edges },
          changed,
        } = await window.worker.setGraphViewport({ ...viewport, zoom });

        console.l("reveal node in graph:", viewport, changed, nodes.length);
        setWaitToMeasure(nodes.map((node) => node.id));
        setCenter(center.x, center.y, { duration: 0, zoom });

        if (changed) {
          setNodes(nodes);
          setEdges(edges);
        }
      })();
    }
  }, [revealPosition]);

  useEffect(() => {
    // TODO: fix the highlight disappearing when the viewport is changed.
    // This is because the node to be removed from the graph when it hidden in the viewport.
    if (revealPosition.treeNodeId && isMeasured) {
      hlRevealPosition();
      setWaitToMeasure([]);
    }
  }, [revealPosition, isMeasured]);
}
