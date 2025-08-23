import type { Previewer } from "./types";

export const unicodePreviewer: Previewer = {
  detector: (value, rawValue) => {
    return /\\u[0-9a-fA-F]{4}/.test(rawValue!);
  },
  generator: async (value, rawValue) => {
    return value;
  },
};
