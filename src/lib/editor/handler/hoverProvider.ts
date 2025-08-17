import { convertColor, isColor } from "@/lib/color";
import { genDate, isDate, isTimestamp } from "@/lib/date";
import type { EditorWrapper } from "@/lib/editor/editor";
import type { editorApi, IPosition, MonacoApi } from "@/lib/editor/types";
import { isIterable } from "@/lib/parser";
import { h } from "@/lib/table/tag";
import { urlToMap } from "@/lib/worker/command/urlToJSON";

export class HoverProvider {
  private editorWrapper: EditorWrapper;
  private monaco: MonacoApi["Raw"];

  constructor(editorWrapper: EditorWrapper) {
    this.editorWrapper = editorWrapper;
    this.monaco = window.monacoApi.Raw;
    this.registerHoverProvider();
  }

  private registerHoverProvider() {
    const previewProvider = async (model: editorApi.ITextModel, position: IPosition) => {
      const r = this.editorWrapper.getNodeAtPosition(position);
      if (!r || r?.type === "key") {
        return;
      }

      const v = r.node.value;
      if (v === undefined || isIterable(r.node)) {
        return;
      }

      const valueInStr = String(v);
      const t = await guessPreviewType(valueInStr);
      if (!t) {
        return;
      }

      let htmlOrHtmls: Awaited<ReturnType<typeof genPreviewHTML>> = [];
      try {
        htmlOrHtmls = await genPreviewHTML(t, valueInStr);
      } catch (error) {
        console.error("Failed to generate preview HTML:", error);
      }

      if (htmlOrHtmls.length === 0) {
        return;
      }

      return {
        contents:
          typeof htmlOrHtmls === "string"
            ? [
                {
                  isTrusted: true,
                  supportHtml: true,
                  value: htmlOrHtmls,
                },
              ]
            : htmlOrHtmls.map((h) => ({
                isTrusted: true,
                supportHtml: true,
                value: h,
              })),
      };
    };

    this.monaco.languages.registerHoverProvider("json", {
      provideHover: previewProvider,
    });
  }
}

type PreviewType = "img" | "url" | "date" | "color" | "base64_encoded" | "uri_encoded";

/**
 * Guesses the preview type of a string value.
 * @param value - The string value to guess.
 * @returns The preview type, or undefined if it cannot be guessed.
 */
async function guessPreviewType(value: string): Promise<PreviewType | undefined> {
  // url or img
  if (/^https?:\/\/.*/.test(value)) {
    if (/\.(png|jpg|jpeg|gif|webp|bmp)\b/i.test(value)) {
      return "img";
    }

    try {
      const r = await fetch(value, { method: "OPTIONS" });
      const contentType = r.headers.get("content-type");
      if (contentType?.startsWith("image/")) {
        return "img";
      }
    } catch (error) {
      console.error("Failed to fetch content-type:", error);
    }

    return "url";
  } else if (/^data:image\/\w+;base64,/.test(value)) {
    return "img";
  } else if (/^[a-z]+[a-z0-9+.-]*:\/\//.test(value)) {
    return "url";
  }

  // timestamp
  if (isTimestamp(value)) {
    const n = Number(value) * (value.length === 10 ? 1000 : 1);
    const t = new Date(n).getTime();
    if (t === n) {
      return "date";
    }
  }

  if (isDate(value)) {
    return "date";
  } else if (isColor(value)) {
    return "color";
  } else if (isBase64(value)) {
    return "base64_encoded";
  } else if (isUriEncoded(value)) {
    return "uri_encoded";
  }

  return;
}

/**
 * Checks if a string is a valid Base64 encoded string.
 * This function supports both standard and URL-safe Base64 variants.
 * @param {string} str The string to check.
 * @returns {boolean} True if the string is a valid Base64 string, false otherwise.
 */
function isBase64(str: string): boolean {
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
}

function isUriEncoded(str: string): boolean {
  try {
    return decodeURIComponent(str) !== str;
  } catch (e) {
    return false;
  }
}

/**
 * Generates the HTML for a preview.
 * @param type - The preview type.
 * @param value - The value to generate the preview for.
 * @returns The HTML for the preview.
 */
async function genPreviewHTML(type: PreviewType, value: string): Promise<string | string[]> {
  if (type === "img") {
    return `<img src="${value}">`;
  } else if (type === "url") {
    const m = urlToMap(value);
    return genTableForMap(m);
  } else if (type === "base64_encoded") {
    const decoded = atob(value);
    return ["**Base64 Decoded**", decoded];
  } else if (type === "uri_encoded") {
    const decoded = decodeURIComponent(value);
    return ["**URI Decoded**", decoded];
  } else if (type === "color") {
    const r = convertColor(value);
    if (!r) {
      return "";
    }

    const { hex, rgb, hsl } = r;
    return [
      h("span", "　".repeat(16)).style(`background-color:${hex};`).toString(),
      genTable(
        {
          HEX: hex,
          RGB: rgb,
          HSL: hsl,
        },
        (k: string, v: string) => ({
          // https://stackoverflow.com/questions/71108780/how-to-set-font-color-for-hover-message
          valueStyle: `color:${hex};`,
        }),
      ),
    ];
  } else if (type === "date") {
    const v = genDate(value);
    const rfc3339 = v.toISOString();
    const local = v.toLocaleString();
    const timestamp = Math.floor(v.getTime() / 1000);
    return genTable({
      ISO: rfc3339,
      Local: local,
      Timestamp: String(timestamp),
    });
  }

  return "";
}

function genTableForMap(m: Map<string, string | Map<string, any>>): string {
  return genTable(
    Object.fromEntries(Array.from(m).map(([k, v]) => [k, typeof v === "string" ? v : genTableForMap(v)])),
  );
}

function genTable(
  data: Record<string, string>,
  styleFn?: (k: string, v: string) => { keyStyle?: string; valueStyle?: string },
): string {
  return h(
    "table",
    ...Object.entries(data).map(([key, value]) => {
      const { keyStyle, valueStyle } = styleFn ? styleFn(key, value) : { keyStyle: "", valueStyle: "" };
      return h(
        "tr",
        h("td", h("span", h("b", key)).style(keyStyle)),
        h("td", h("span", "　")),
        h("td", h("span", value).style(valueStyle)),
      );
    }),
  ).toString();
}
