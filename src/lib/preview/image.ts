import type { Previewer } from "./types";

export const imagePreviewer: Previewer = {
  detector: async (value) => {
    if (/^https?:\/\/.*/.test(value)) {
      if (/\.(png|jpg|jpeg|gif|webp|bmp)\b/i.test(value)) {
        return true;
      }

      try {
        const r = await fetch(value, { method: "OPTIONS" });
        const contentType = r.headers.get("content-type");
        return !!contentType?.startsWith("image/");
      } catch (error) {
        console.error("Failed to fetch content-type:", error);
        return false;
      }
    }

    return /^data:image\/\w+;base64,/.test(value);
  },

  generator: (value) => {
    return `<img src="${value}">`;
  },
};
