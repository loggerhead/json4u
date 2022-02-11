import { ref, Ref } from "vue";
import "codemirror/lib/codemirror.css";
import "codemirror/theme/idea.css";
import "codemirror/addon/fold/foldgutter.css";
import "codemirror/addon/lint/lint.css";
// @ts-ignore
import jsonlint from "jsonlint-mod";

export default class Editor {
  cm: CodeMirror.Editor;
  static changeVersion = ref(0);
  static compareVersion = ref(0);

  constructor() {
    this.cm = <CodeMirror.Editor>(<unknown>null);
  }

  async setupCM(id: string) {
    var CodeMirror = await import("codemirror");
    await Promise.all([
      // @ts-ignore
      import("codemirror/mode/javascript/javascript.js"),
      import("codemirror/addon/display/placeholder.js"),
      import("codemirror/addon/fold/foldgutter.js"),
      import("codemirror/addon/fold/foldcode.js"),
      import("codemirror/addon/fold/brace-fold.js"),
      import("codemirror/addon/lint/lint.js"),
      import("codemirror/addon/lint/json-lint.js"),
    ]);
    (window as any).jsonlint = jsonlint;

    const el = document.getElementById(id) as HTMLTextAreaElement;
    this.cm = CodeMirror.fromTextArea(el, {
      mode: "application/json",
      theme: "idea",
      smartIndent: true,
      lineNumbers: true,
      // 显示折叠箭头
      foldGutter: true,
      gutters: ["CodeMirror-linenumbers", "CodeMirror-foldgutter", "CodeMirror-lint-markers"],
    });

    this.cm.setSize("100%", "100%");
    this.setupDragFileHandler();
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
    this.cm.on("cursorActivity", (cm) => {
      const pos = cm.getCursor();
      // NOTICE: 比实际点击位置小一行
      fn(pos.line + 1);
    });
  }

  setChangesListener(fn: () => void) {
    this.cm.on("changes", (cm, e) => {
      const hasEvent = e.filter((e) => e.origin === "paste" && e.from.line == 0 && e.from.ch == 0).length > 0;
      Editor.changeVersion.value = Editor.compareVersion.value + 1;

      if (hasEvent && cm.getValue().length > 0) {
        fn();
      }
    });

    this.setPasteFileHandler(fn);
  }

  private setPasteFileHandler(fn: () => void) {
    this.cm.on("paste", (cm, e) => {
      const items = (e.clipboardData || (e as any).originalEvent.clipboardData).items;

      for (const item of items) {
        if (item.kind !== "file") {
          continue;
        }
        e.preventDefault();

        const reader = new FileReader();
        reader.onload = function (e) {
          cm.setValue(e.target?.result as string);
          fn();
        };
        reader.readAsText(item.getAsFile());
      }
    });
  }

  // 拖拽时展示 hover 效果
  private setupDragFileHandler() {
    const dragHandler = (e: DragEvent) => {
      const el = (e.target as HTMLElement).closest(".CodeMirror");

      if (e.type === "dragover") {
        el?.classList.add("editor-hover");
      } else {
        el?.classList.remove("editor-hover");
      }
    };

    this.cm.on("dragover", (_, e) => {
      dragHandler(e);
    });
    this.cm.on("drop", (_, e) => {
      // clear all text before drop content is fill in
      this.setText("");
      dragHandler(e);
    });
    this.cm.on("dragleave", (_, e) => {
      dragHandler(e);
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
    this.cm.markText({ line: lineno - 1, ch: from }, { line: lineno - 1, ch: to }, { className: cls });
  }

  clearClass() {
    this.cm.getAllMarks().forEach((marker) => marker.clear());
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

  static incCompareVersion() {
    this.compareVersion.value++;
  }

  static isCompared() {
    return this.compareVersion.value > 0 && this.compareVersion.value >= this.changeVersion.value;
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
