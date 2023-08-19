import * as monaco from "monaco-editor/esm/vs/editor/editor.api";

// 在 monaco 中实现 placeholder: https://github.com/microsoft/monaco-editor/issues/568
/**
 * Represents an placeholder renderer for monaco editor
 * Roughly based on https://github.com/microsoft/vscode/blob/main/src/vs/workbench/contrib/codeEditor/browser/untitledTextEditorHint/untitledTextEditorHint.ts
 */
export default class PlaceholderContentWidget {
  static ID = "editor.widget.placeholderHint";

  constructor(editor, lines) {
    this.lines = lines;
    this.editor = editor;
    // register a listener for editor code changes
    editor.onDidChangeModelContent(() => this.onDidChangeModelContent());
    // ensure that on initial load the placeholder is shown
    this.onDidChangeModelContent();
  }

  placeholder() {
    return this.lines.join("\n");
  }

  getDomNode() {
    if (!this.dom) {
      this.dom = document.createElement("div");
      this.editor.applyFontInfo(this.dom);
      this.dom.textContent = this.placeholder();
      this.dom.style["width"] = "max-content";
      this.dom.style["color"] = "#64646480";
      this.dom.style["white-space"] = "pre-line";
      this.dom.style["line-height"] = "1.6";
      this.dom.style["font-size"] = "18px";
    }

    return this.dom;
  }

  onDidChangeModelContent() {
    if (this.editor.getValue() === "") {
      this.editor.addContentWidget(this);
    } else {
      this.editor.removeContentWidget(this);
    }
  }

  getId() {
    return PlaceholderContentWidget.ID;
  }

  getPosition() {
    return {
      position: { lineNumber: 1, column: 1 },
      preference: [monaco.editor.ContentWidgetPositionPreference.BELOW],
    };
  }

  dispose() {
    this.editor.removeContentWidget(this);
  }
}
