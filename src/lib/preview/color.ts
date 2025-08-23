import { convertColor, isColor } from "@/lib/color";
import { h } from "@/lib/table/tag";
import type { Previewer } from "./types";
import { genTable } from "./utils";

export const colorPreviewer: Previewer = {
  detector: isColor,
  generator: (value) => {
    const r = convertColor(value);
    if (!r) {
      return "";
    }

    const { hex, rgb, hsl } = r;
    return [
      h("span", "　".repeat(16)).style(`background-color:${hex};`).toString(),
      genTable({
        HEX: hex,
        RGB: rgb,
        HSL: hsl,
      }),
    ];
  },
};
