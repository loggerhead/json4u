import { t } from "@/stores/editorStore";
import type { Previewer } from "./types";

export const uriPreviewer: Previewer = {
  detector: (str) => {
    try {
      return decodeURIComponent(str) !== str;
    } catch (e) {
      return false;
    }
  },
  generator: (value) => {
    const decoded = decodeURIComponent(value);
    return [`**URI ${t("Preview.Decoded")}**`, decoded];
  },
};
