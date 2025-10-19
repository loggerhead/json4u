import { type Dispatch, type RefObject, type SetStateAction, useEffect } from "react";
import { ViewMode } from "@/lib/db/config";
import type { EdgeWithData, NodeWithData, RevealFrom } from "@/lib/graph/types";
import { refreshInterval } from "@/lib/graph/virtual";
import { useDebounceFn } from "@/lib/hooks";
import { useStatusStore } from "@/stores/statusStore";
import { useOnViewportChange, useReactFlow } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { includes } from "lodash-es";
import { useResizeObserver } from "usehooks-ts";
import { useShallow } from "zustand/shallow";
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
        width,
        height,
        nodes.length,
        edges.length,
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
        console.l("compute virtual graph since the viewport has changed:", viewport, nodes.length);
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
  setNodes: Dispatch<SetStateAction<NodeWithData[]>>,
  setEdges: Dispatch<SetStateAction<EdgeWithData[]>>,
) {
  const { getZoom, setCenter } = useReactFlow();
  const { isNeedReveal, revealPosition } = useStatusStore(
    useShallow((state) => ({
      isNeedReveal: state.viewMode === ViewMode.Graph && state.isNeedReveal("graph"),
      revealPosition: state.revealPosition,
    })),
  );

  // compute the position and the virtual graph of the reveal node.
  useEffect(() => {
    (async () => {
      if (isNeedReveal && revealPosition.treeNodeId) {
        const res = await window.worker.setGraphRevealPosition(revealPosition, getZoom());
        if (!res) {
          console.l("skip reveal position in graph:", revealPosition);
          return;
        }

        const {
          renderable: { nodes, edges },
          center: { x, y, zoom },
        } = res;

        console.l(
          "reveal position in graph:",
          revealPosition,
          res.selected,
          res.center,
          res.changed,
          res.renderable.nodes.length,
          res.renderable.edges.length,
        );
        setNodes(nodes);
        setEdges(edges);

        if (!includes<RevealFrom>(["graph", "graphClick"], revealPosition.from)) {
          setCenter(x, y, { duration: 0, zoom });
        }
      }
    })();
  }, [revealPosition, isNeedReveal]);
}
