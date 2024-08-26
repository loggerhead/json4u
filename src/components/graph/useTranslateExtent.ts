import { useEffect, useState } from "react";
import { config } from "@/lib/graph/layout";
import { NodesAndEdges } from "./useNodesAndEdges";

export default function useTranslateExtent({ levelMeta }: NodesAndEdges) {
  const [translateExtent, setTranslateExtent] = useState<[[number, number], [number, number]]>([
    [0, 0],
    [0, 0],
  ]);

  useEffect(() => {
    if (levelMeta) {
      setTranslateExtent([
        [-config.translateMargin, -config.translateMargin],
        [
          levelMeta[levelMeta.length - 1].x + config.translateMargin,
          levelMeta[levelMeta.length - 1].y + config.translateMargin,
        ],
      ]);
    }
  }, [JSON.stringify(levelMeta)]);

  return translateExtent;
}
