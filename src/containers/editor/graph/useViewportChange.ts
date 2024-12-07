import { type Dispatch, type RefObject, type SetStateAction, useCallback, useEffect, useState } from "react";
import { ViewMode } from "@/lib/db/config";
import type { EdgeWithData, NodeWithData } from "@/lib/graph/types";
import { clearHighlight, highlightElement } from "@/lib/graph/utils";
import { refreshInterval } from "@/lib/graph/virtual";
import { useDebounceFn } from "@/lib/hooks";
import { getParentId } from "@/lib/idgen";
import { useStatusStore } from "@/stores/statusStore";
import { getTree } from "@/stores/treeStore";
import { useOnViewportChange, useReactFlow } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { keyBy } from "lodash-es";
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
  const { isNeedReveal, revealPosition } = useStatusStore(
    useShallow((state) => ({
      isNeedReveal: state.viewMode === ViewMode.Graph && state.isNeedReveal("graph"),
      revealPosition: state.revealPosition,
    })),
  );

  const [waitToMeasure, setWaitToMeasure] = useState<string[]>([]);
  const nodesMap = keyBy(nodes, "id");
  const isMeasured = waitToMeasure.length && waitToMeasure.every((id) => nodesMap[id]?.measured?.width);

  // compute the position and the virtual graph of the reveal node.
  useEffect(() => {
    if (isNeedReveal && revealPosition.treeNodeId) {
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

        console.l("reveal node in graph:", changed, revealPosition, viewport, nodes.length);
        setWaitToMeasure(nodes.map((node) => node.id));
        setCenter(center.x, center.y, { duration: 0, zoom });

        if (changed) {
          setNodes(nodes);
          setEdges(edges);
        }
      })();
    }
  }, [revealPosition, isNeedReveal]);

  // highlight the reveal node or search result.
  // TODO: fix the highlight disappearing when the viewport is changed. This is because the node to be removed from the graph when it hidden in the viewport.
  useEffect(() => {
    const { treeNodeId, type } = revealPosition;

    // Every time nodes are set, it will cause the graph to render twice.
    // We need to highlight after the second render. Otherwise, the highlight will not take effect.
    // The first render will not set `node.measured`, but the second render will.
    if (isNeedReveal && isMeasured && treeNodeId) {
      (async () => {
        clearHighlight();
        const isKV = type !== "node";
        let el: HTMLDivElement;

        if (isKV) {
          const kvEl = document.querySelector(`.graph-kv[data-tree-id="${treeNodeId}"]`);
          el = kvEl?.querySelector(`.${type === "value" ? "graph-v" : "graph-k"}`) as HTMLDivElement;
        } else {
          el = document.querySelector(`.graph-node[data-tree-id="${treeNodeId}"]`) as HTMLDivElement;
        }

        if (el) {
          const graphNodeId = getTree().getGraphNodeId(treeNodeId)!;
          const { nodes, edges } = await window.worker.toggleGraphNodeSelected(graphNodeId);
          setNodes(nodes);
          setEdges(edges);
          isKV && highlightElement(el);
        }
      })();

      setWaitToMeasure([]);
    }
  }, [revealPosition, isNeedReveal, isMeasured]);
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
