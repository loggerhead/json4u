import { genValueAttrs } from "@/lib/graph/layout";
import { toPath } from "@/lib/idgen";
import { cn } from "@/lib/utils";
import { type SearchResult } from "@/lib/worker/stores/types";
import { useWorker } from "@/stores/editorStore";
import { useStatusStore } from "@/stores/statusStore";
import { getTree } from "@/stores/treeStore";
import SearchInput from "./SearchInput";

export default function ViewSearchInput() {
  const worker = useWorker()!;
  const setRevealPosition = useStatusStore((state) => state.setRevealPosition);

  return (
    <SearchInput
      search={worker.searchInView}
      onSelect={(item) =>
        setRevealPosition({
          type: item.matchType,
          treeNodeId: item.id,
        })
      }
      Item={Item}
      placeholder={"search_json"}
      bindShortcut="F"
    />
  );
}

function Item(props: SearchResult) {
  const { matchType, id } = props;
  const path = toPath(id);
  const node = getTree().node(id);

  if (!node) {
    return null;
  }

  const { className, text } = genValueAttrs(node);

  return (
    <div className="w-full h-9 flex flex-col">
      <div className={cn("text-sm", matchType === "key" ? "text-hl-key" : className)}>
        {matchType === "key" ? path[path.length - 1] : text}
      </div>
      <div dir="rtl" className="text-xs text-muted-foreground truncate whitespace-nowrap text-left">
        {path.join(" > ")}
      </div>
    </div>
  );
}
