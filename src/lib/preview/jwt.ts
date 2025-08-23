import { t } from "@/stores/editorStore";
import type { Previewer } from "./types";
import { genTable } from "./utils";

export const jwtPreviewer: Previewer = {
  detector: (str) => {
    return /^(eyJ[A-Za-z0-9_\/-]+\.){2}([A-Za-z0-9_\/-]+)?$/.test(str);
  },
  generator: (str) => {
    try {
      const parts = str.split(".").map((part) => {
        // Convert base64url to base64
        let base64 = part.replace(/-/g, "+").replace(/_/g, "/");
        // Add padding
        const padLength = 4 - (base64.length % 4);
        if (padLength < 4) {
          base64 += "=".repeat(padLength);
        }
        return atob(base64);
      });

      const decodedParts = parts.slice(0, 2).map((part) => JSON.parse(part));
      const decoded = Object.assign(
        {
          [t("Preview.SignatureLength")]: parts[2].length,
        },
        ...decodedParts,
      );
      return [`**JWT ${t("Preview.Decoded")}**`, genTable(decoded)];
    } catch (error) {
      console.error("Failed to parse JWT parts as JSON:", error);
      return "";
    }
  },
};
