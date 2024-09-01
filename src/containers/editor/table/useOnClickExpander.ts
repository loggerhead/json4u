import { useCallback } from "react";
import { MouseEvent } from "react";
import { genExpanderId, genTableId, isPeeled, join, peelExpanderId, splitParentPointer } from "@/lib/idgen";
import { useTree } from "@/stores/treeStore";

export function useOnClickExpander() {
  const tree = useTree();

  return useCallback(
    (ev: MouseEvent) => {
      const triggerExpander = ev.target as HTMLElement;
      const nodeId = peelExpanderId(triggerExpander.id);

      // if not click on expander
      if (!isPeeled(triggerExpander.id, nodeId)) {
        return;
      }

      ev.preventDefault();
      ev.stopPropagation();
      ev.nativeEvent.stopImmediatePropagation();

      const hidden = triggerExpander.classList.contains("codicon-folding-expanded");
      // change expander status
      triggerExpander.classList.toggle("codicon-folding-expanded");
      triggerExpander.classList.toggle("codicon-folding-collapsed");

      const node = tree.node(nodeId);

      if (node !== undefined) {
        toggle(nodeId, hidden);
      } else {
        const { parent, lastKey } = splitParentPointer(nodeId);
        const arrayNode = tree.node(parent ?? nodeId);
        tree.childrenIds(arrayNode).forEach((rowId) => toggle(join(rowId, lastKey), hidden));
      }
    },
    [tree],
  );
}

function toggle(id: string, hidden: boolean) {
  const el = document.getElementById(genTableId(id));
  const bindExpander = document.getElementById(genExpanderId(id))!;

  if (!el) {
    console.error("cannot find element to toggle hidden");
    return;
  }

  if (hidden) {
    el.classList.add("hidden");
    bindExpander.classList.remove("codicon-folding-expanded");
    bindExpander.classList.add("codicon-folding-collapsed");
  } else {
    el.classList.remove("hidden");
    bindExpander.classList.add("codicon-folding-expanded");
    bindExpander.classList.remove("codicon-folding-collapsed");
  }
}
