import type { EditorWrapper } from "@/lib/editor/editor";
import type { languages, Range, editorApi, MonacoApi } from "@/lib/editor/types";
import { getChildCount } from "@/lib/parser";

export class InlayHintsProvider {
  private editorWrapper: EditorWrapper;
  private monaco: MonacoApi["Raw"];
  // for cache
  private treeVersion?: number;
  private hints: languages.InlayHint[];

  constructor(editorWrapper: EditorWrapper) {
    this.editorWrapper = editorWrapper;
    this.monaco = window.monacoApi.Raw;
    this.treeVersion = 0;
    this.hints = [];
    this.registerInlayHintsProvider();
  }

  private registerInlayHintsProvider() {
    const provider = {
      // @param range The range of the document that is visible in the editor.
      provideInlayHints: (model: editorApi.ITextModel, range: Range) => {
        const tree = this.editorWrapper.tree;

        if (this.treeVersion !== tree.version) {
          this.treeVersion = tree.version;
          this.hints = [];

          Object.values(tree.nodeMap).forEach((node) => {
            const count = getChildCount(node);
            if (!(count > 0 && node.type === "array")) {
              return;
            }

            const { lineNumber, column } = this.editorWrapper.getPositionAt(node.offset);
            const position = {
              lineNumber,
              column: column + 1,
            };

            this.hints.push({
              label: `[${count}]`,
              position: position,
              kind: this.monaco.languages.InlayHintKind.Type,
              paddingLeft: true,
            });
          });
        }

        // Filter hints based on the visible range to avoid duplicates when folding.
        const { startLineNumber, endLineNumber } = range;
        const filteredHints = this.hints.filter(
          (hint) =>
            hint.position.lineNumber >= startLineNumber &&
            hint.position.lineNumber <= endLineNumber
        );

        return { hints: filteredHints, dispose: () => {} };
      },
    };

    this.monaco.languages.registerInlayHintsProvider("json", provider);
  }
}
