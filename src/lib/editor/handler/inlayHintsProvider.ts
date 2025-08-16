import type { EditorWrapper } from "@/lib/editor/editor";
import type { languages, Range, editorApi, MonacoApi } from "@/lib/editor/types";
import { getChildCount } from "@/lib/parser";

// Duplicate hints may appear after folding, which seems to be a bug in the Monaco editor:
// https://github.com/microsoft/monaco-editor/issues/4700
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
      provideInlayHints: (model: editorApi.ITextModel, range: Range) => {
        const tree = this.editorWrapper.tree;

        if (this.treeVersion !== tree.version) {
          this.treeVersion = tree.version;
          this.hints = [];

          Object.values(tree.nodeMap).forEach((node) => {
            const count = getChildCount(node);
            if (count === 0) {
              return;
            }

            const { lineNumber, column } = this.editorWrapper.getPositionAt(node.offset);
            const position = {
              lineNumber,
              column: column + 1,
            };

            this.hints.push({
              label: node.type === "array" ? `[${count}]` : `{${count}}`,
              position: position,
              kind: this.monaco.languages.InlayHintKind.Type,
              paddingLeft: true,
            });
          });
        }

        return { hints: this.hints, dispose: () => {} };
      },
    };

    this.monaco.languages.registerInlayHintsProvider("json", provider);
  }
}
