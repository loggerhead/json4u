import { t } from "@/stores/editorStore";
import type { Previewer } from "./types";

export const base64Previewer: Previewer = {
  detector: (str) => {
    if (str.length === 0) {
      return false;
      // If the string consists of only numbers, it is considered not to be Base64 encoded.
    } else if (/^\d+(\.\d+)?$/.test(str)) {
      return false;
    }

    // Replace URL-safe characters with standard characters for uniform validation.
    const normalizedStr = str.replace(/-/g, "+").replace(/_/g, "/");

    // The regex checks for valid Base64 characters and correct padding.
    const base64Regex = /^[A-Za-z0-9+/]*=?=?$/;
    if (!base64Regex.test(normalizedStr)) {
      return false;
    } else if (normalizedStr.length % 4 !== 0) {
      return false;
    }

    const upperCaseProb = (str.match(/[A-Z]/g) || []).length / str.length;
    const lowerCaseProb = (str.match(/[a-z]/g) || []).length / str.length;
    const numberProb = (str.match(/[0-9]/g) || []).length / str.length;

    // Ensure that there is a reasonable distribution of character types based on the 26:26:10 ratio
    if (upperCaseProb < 0.1 && lowerCaseProb < 0.1 && numberProb < 0.04) {
      return false;
    }

    // Finally, try to decode it. The atob function will throw an error for invalid Base64.
    try {
      atob(normalizedStr);
      return true;
    } catch (e) {
      return false;
    }
  },
  generator: (value) => {
    const decoded = atob(value);
    return [`**Base64 ${t("Preview.Decoded")}**`, decoded];
  },
};
