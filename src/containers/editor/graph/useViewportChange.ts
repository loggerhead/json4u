import { RefObject, useCallback } from "react";
import { refreshInterval } from "@/lib/graph/computeVisible";
import { useEditorStore } from "@/stores/editorStore";
import { useOnViewportChange } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { debounce } from "lodash-es";
import { useResizeObserver } from "usehooks-ts";
import { setViewportSize, type NodesAndEdges } from "./useNodesAndEdges";

export default function useViewportChange(ref: RefObject<HTMLDivElement>, { setNodes, setEdges }: NodesAndEdges) {
  const worker = useEditorStore((state) => state.worker);

  const onResize = useCallback(
    debounce(
      async ({ width, height }) => {
        if (!(worker && width && height)) return;
        setViewportSize(width, height);
        const { visible, changed } = await worker.setGraphSize(width, height);
        if (changed) {
          setNodes(visible.nodes);
          setEdges(visible.edges);
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
        if (!worker) return;
        const { visible, changed } = await worker.setGraphViewport(viewport);
        if (changed) {
          setNodes(visible.nodes);
          setEdges(visible.edges);
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
