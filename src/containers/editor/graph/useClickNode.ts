import { useCallback, type MouseEvent } from "react";
import type { RevealFrom, RevealType } from "@/lib/graph/types";
import { useStatusStore } from "@/stores/statusStore";
import { debounce } from "lodash-es";

export default function useClickNode() {
  const setRevealPosition = useStatusStore((state) => state.setRevealPosition);
  const delaySetRevealPosition = debounce(setRevealPosition, 100, { trailing: true });

  return {
    onClick: useCallback(
      async (e: MouseEvent, treeNodeId: string, type: RevealType, from: RevealFrom) => {
        e.stopPropagation();
        delaySetRevealPosition({ treeNodeId, type, from });
      },
      [setRevealPosition, delaySetRevealPosition],
    ),
    cancelClickNode: delaySetRevealPosition.cancel,
  };
}
