import { RefObject, useCallback, useEffect } from "react";
import { refreshInterval } from "@/lib/graph/virtual";
import { useEditorStore } from "@/stores/editorStore";
import { useStatusStore } from "@/stores/statusStore";
import { useOnViewportChange, useReactFlow } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { debounce } from "lodash-es";
import { useResizeObserver } from "usehooks-ts";
import { setViewportSize } from "./useVirtualGraph";

export function useViewportChange(ref: RefObject<HTMLDivElement>) {
  const worker = useEditorStore((state) => state.worker);
  const { setNodes, setEdges } = useReactFlow();

  const onResize = useCallback(
    debounce(
      async ({ width, height }) => {
        if (!(worker && width && height)) {
          return;
        }

        const {
          renderable: { nodes, edges },
          changed,
        } = await worker.setGraphSize(width, height);

        setViewportSize(width, height);
        if (changed) {
          setNodes(nodes);
          setEdges(edges);
        }
      },
      refreshInterval,
      { trailing: true },
    ),
    [worker],
  );

  const onViewportChange = useCallback(
    debounce(
      async (viewport) => {
        if (!worker) {
          return;
        }

        const {
          renderable: { nodes, edges },
          changed,
        } = await worker.setGraphViewport(viewport);

        if (changed) {
          setNodes(nodes);
          setEdges(edges);
        }
      },
      refreshInterval,
      { trailing: true },
    ),
    [worker],
  );

  useResizeObserver({ ref, onResize });
  useOnViewportChange({ onChange: onViewportChange });
}

export function useRevealNode() {
  const { getZoom, setCenter } = useReactFlow();
  const { id, version } = useStatusStore((state) => state.revealId);
  const worker = useEditorStore((state) => state.worker)!;

  useEffect(() => {
    if (worker && id) {
      (async () => {
        const { x, y } = await worker.computeGraphRevealPosition(id);
        setCenter(x, y, { duration: 100, zoom: getZoom() });
      })();
    }
  }, [worker, id, version]);
}
