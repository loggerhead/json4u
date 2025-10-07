import type { EditorWrapper } from "@/lib/editor/editor";
import type { editorApi, IPosition, MonacoApi } from "@/lib/editor/types";
import { isIterable } from "@/lib/parser";
import { generatePreview } from "@/lib/preview";

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
      if (!r || r?.target === "key") {
        return;
      }

      const v = r.node.value;
      const rawValue = r.node.rawValue;
      if (v === undefined || rawValue === undefined || isIterable(r.node)) {
        return;
      }

      const valueInStr = typeof v === "string" ? v : rawValue;
      let htmlOrHtmls: Awaited<ReturnType<typeof generatePreview>> = [];

      try {
        // Supported HTML tags:
        // https://github.com/microsoft/monaco-editor/issues/801#issuecomment-941713491
        // https://github.com/microsoft/vscode/blob/6d2920473c6f13759c978dd89104c4270a83422d/src/vs/base/browser/markdownRenderer.ts#L292-L296
        htmlOrHtmls = await generatePreview(valueInStr, rawValue);
      } catch (error) {
        console.error("Failed to generate preview HTML:", error);
      }

      if (!htmlOrHtmls || htmlOrHtmls.length === 0) {
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
