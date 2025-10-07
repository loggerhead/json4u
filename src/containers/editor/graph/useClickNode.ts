import { useCallback, type MouseEvent } from "react";
import type { RevealFrom, RevealType } from "@/lib/graph/types";
import { useStatusStore } from "@/stores/statusStore";

export default function useClickNode() {
  const setRevealPosition = useStatusStore((state) => state.setRevealPosition);

  return useCallback(
    async (e: MouseEvent, treeNodeId: string, type: RevealType, from: RevealFrom) => {
      e.stopPropagation();
      setRevealPosition({ treeNodeId, type, from });
    },
    [setRevealPosition],
  );
}
