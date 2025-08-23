import { urlToMap } from "@/lib/worker/command/urlToJSON";
import type { Previewer } from "./types";
import { genTableForMap } from "./utils";

export const urlPreviewer: Previewer = {
  detector: (value) => {
    return /^https?:\/\/.*/.test(value) || /^[a-z]+[a-z0-9+.-]*:\/\//.test(value);
  },
  generator: (value) => {
    const m = urlToMap(value);
    return genTableForMap(m);
  },
};
