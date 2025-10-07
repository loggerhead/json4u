import { urlToMap } from "@/lib/worker/command/urlToJSON";
import type { Previewer } from "./types";
import { genTable } from "./utils";

export const urlPreviewer: Previewer = {
  detector: (value) => {
    return /^https?:\/\/.*/.test(value) || /^[a-z]+[a-z0-9+.-]*:\/\//.test(value);
  },
  generator: (value) => {
    const { Query: q, ...m } = mapToRecord(urlToMap(value, 1));
    const tbl = genTable(m as Record<string, string>);

    if (q) {
      return [tbl, "---------", "**Query**", genTable(q as Record<string, string>)];
    } else {
      return tbl;
    }
  },
};

function mapToRecord(map: Map<string, string | Map<string, any>>): Record<string, string | Record<string, any>> {
  const result: Record<string, string | Record<string, any>> = {};
  for (const [key, value] of map) {
    if (value instanceof Map) {
      result[key] = mapToRecord(value);
    } else {
      result[key] = value;
    }
  }
  return result;
}
