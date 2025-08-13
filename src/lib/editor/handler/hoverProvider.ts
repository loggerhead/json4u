import { convertColor, isColor } from "@/lib/color";
import { genDate, isDate, isTimestamp } from "@/lib/date";
import type { EditorWrapper } from "@/lib/editor/editor";
import type { editorApi, IPosition, MonacoApi } from "@/lib/editor/types";
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
      if (r?.type !== "value") {
        return;
      }

      const v = r.node.value;
      if (v === undefined) {
        return;
      }

      const valueInStr = String(v);
      const t = await guessPreviewType(valueInStr);
      if (!t) {
        return;
      }

      const htmlOrHtmls = await genPreviewHTML(t, valueInStr);
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

type PreviewType = "img" | "url" | "date" | "color";

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
  }

  if (isColor(value)) {
    return "color";
  }

  return;
}

async function genPreviewHTML(type: PreviewType, value: string): Promise<string | string[]> {
  if (type === "img") {
    return `<img src="${value}">`;
  } else if (type === "url") {
    const m = urlToMap(value);
    return genTableForMap(m);
  } else if (type === "color") {
    const r = convertColor(value);
    if (!r) {
      return "";
    }

    const { hex, rgb, hsl } = r;
    return [
      `<span style="background-color:${hex};">${"　".repeat(16)}</span>`,
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
  const rows = Object.entries(data)
    .map(([key, value]) => {
      const { keyStyle, valueStyle } = styleFn ? styleFn(key, value) : {};
      return `<tr>
        <td>
          <span ${keyStyle ? `style="${keyStyle}"` : ""}>
            <b>${key}</b>
          </span>
        </td>
        <td>
          <span ${valueStyle ? `style="${valueStyle}"` : ""}>
            ${value}
          </span>
        </td>
      </tr>`;
    })
    .join("");
  return `<table>${rows}</table>`;
}
