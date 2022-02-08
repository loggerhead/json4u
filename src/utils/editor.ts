import { Ref } from "vue";
import "codemirror/lib/codemirror.css";
import "codemirror/theme/idea.css";
import "codemirror/addon/fold/foldgutter.css";
import "codemirror/addon/lint/lint.css";
// @ts-ignore
import jsonlint from "jsonlint-mod";

export default class Editor {
  cm: CodeMirror.Editor;

  constructor() {
    this.cm = <CodeMirror.Editor>(<unknown>null);
  }

  async setupCM(id: string) {
    var CodeMirror = await import("codemirror");
    // @ts-ignore
    await import("codemirror/mode/javascript/javascript.js");
    await import("codemirror/addon/display/placeholder.js");
    await import("codemirror/addon/fold/foldgutter.js");
    await import("codemirror/addon/fold/foldcode.js");
    await import("codemirror/addon/fold/brace-fold.js");
    await import("codemirror/addon/lint/lint.js");
    await import("codemirror/addon/lint/json-lint.js");
    (window as any).jsonlint = jsonlint;

    const el = document.getElementById(id) as HTMLTextAreaElement;
    const cm = CodeMirror.fromTextArea(el, {
      mode: "application/json",
      theme: "idea",
      smartIndent: true,
      lineNumbers: true,
      // 显示折叠箭头
      foldGutter: true,
      gutters: ["CodeMirror-linenumbers", "CodeMirror-foldgutter", "CodeMirror-lint-markers"],
    });

    cm.setSize("100%", "100%");
    this.cm = cm;
    return this;
  }

  refresh() {
    this.cm.refresh();
  }

  lint(): boolean {
    if (this.cm.getValue().trim().length === 0) {
      return false;
    }

    this.cm.setOption("lint", true);
    return true;
  }

  setClickListener(fn: (_: number) => void) {
    this.cm.on("cursorActivity", (cm: CodeMirror.Editor) => {
      const pos = cm.getCursor();
      // NOTICE: 比实际点击位置小一行
      fn(pos.line + 1);
    });
  }

  setPasteListener(fn: (event: CodeMirror.EditorChange) => void) {
    this.cm.on("inputRead", (cm: CodeMirror.Editor, event: CodeMirror.EditorChange) => {
      if (event.origin === "paste") {
        fn(event);
      }
    });
  }

  getText(): string {
    return this.cm.getValue();
  }

  setText(text: string) {
    return this.cm.setValue(text);
  }

  hasClass(lineno: number, cls: string): boolean {
    const lineInfo = this.cm.lineInfo(lineno - 1);
    return lineInfo.wrapClass ? lineInfo.wrapClass.split(/\s+/).includes(cls) : false;
  }

  addClass(lineno: number, cls: string) {
    this.cm.addLineClass(lineno - 1, "wrap", cls);
  }

  removeClass(lineno: number, cls: string) {
    this.cm.removeLineClass(lineno - 1, "wrap", cls);
  }

  addClassToRange(lineno: number, from: number, to: number, cls: string) {
    this.cm.markText({ line: lineno, ch: from }, { line: lineno, ch: to }, { className: cls });
  }

  scrollTo(lineno: number) {
    let t = this.cm.charCoords({ line: lineno, ch: 0 }, "local").top;
    let middleHeight = this.cm.getScrollerElement().offsetHeight / 2;
    this.cm.scrollTo(null, t - middleHeight - 5);
  }

  startOperation() {
    this.cm.startOperation();
  }

  endOperation() {
    this.cm.endOperation();
    this.refresh();
  }

  focus() {
    this.cm.focus();
  }

  static setSyncScroll(leftEditor: Editor, rightEditor: Editor, enableSyncScroll: Ref<boolean>) {
    leftEditor.cm.on("scroll", function () {
      if (enableSyncScroll.value) {
        const scrollInfo = leftEditor.cm.getScrollInfo();
        rightEditor.cm.scrollTo(scrollInfo.left, scrollInfo.top);
      }
    });
    rightEditor.cm.on("scroll", function () {
      if (enableSyncScroll.value) {
        const scrollInfo = rightEditor.cm.getScrollInfo();
        leftEditor.cm.scrollTo(scrollInfo.left, scrollInfo.top);
      }
    });
  }
}
