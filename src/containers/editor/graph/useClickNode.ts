import { useCallback, type MouseEvent } from "react";
import type { RevealFrom, RevealTarget } from "@/lib/graph/types";
import { useStatusStore } from "@/stores/statusStore";
import { debounce } from "lodash-es";

export default function useClickNode() {
  const setRevealPosition = useStatusStore((state) => state.setRevealPosition);
  const delaySetRevealPosition = debounce(setRevealPosition, 100, { trailing: true });

  return {
    onClick: useCallback(
      async (e: MouseEvent, treeNodeId: string, target: RevealTarget, from: RevealFrom) => {
        e.stopPropagation();
        const pos = { treeNodeId, target, from };
        console.l("set reveal position:", pos);
        delaySetRevealPosition(pos);
      },
      [setRevealPosition, delaySetRevealPosition],
    ),
    cancelClickNode: delaySetRevealPosition.cancel,
  };
}
