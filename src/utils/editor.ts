import { ref, Ref } from "vue";
import "codemirror/lib/codemirror.css";
import "codemirror/theme/idea.css";
import "codemirror/addon/fold/foldgutter.css";
import "codemirror/addon/lint/lint.css";
import "codemirror/addon/dialog/dialog.css";
// @ts-ignore
import jsonlint from "jsonlint-mod";
import { OptionNum } from "./typeHelper";
import { Config } from "./config";

export default class Editor {
  cm: CodeMirror.Editor;
  clickFn: null | ((_: CodeMirror.Editor) => void);
  static changeVersion = ref(0);
  static compareVersion = ref(0);

  constructor() {
    this.cm = <CodeMirror.Editor>(<unknown>null);
    this.clickFn = null;
  }

  async init(id: string, conf: Config) {
    var CodeMirror;
    await import("codemirror").then(async (obj) => {
      CodeMirror = obj;
      (window as any).CodeMirror = CodeMirror;

      await Promise.all([
        // @ts-ignore
        import("codemirror/mode/javascript/javascript.js"),
        import("codemirror/addon/display/placeholder.js"),
        import("codemirror/addon/fold/foldgutter.js"),
        import("codemirror/addon/fold/foldcode.js"),
        import("codemirror/addon/fold/brace-fold.js"),
        import("codemirror/addon/lint/lint.js"),
        import("codemirror/addon/lint/json-lint.js"),
        import("codemirror/addon/search/searchcursor.js"),
        import("codemirror/addon/scroll/annotatescrollbar.js"),
        import("codemirror/addon/search/matchesonscrollbar.js"),
        // https://github.com/zhuhs/codemirror-search-replace
        import("codemirror-search-replace/src/search.js"),
      ]);

      (window as any).jsonlint = jsonlint;
    });

    const el = document.getElementById(id) as HTMLTextAreaElement;
    this.cm = CodeMirror.fromTextArea(el, {
      mode: "application/json",
      theme: "idea",
      gutters: ["CodeMirror-linenumbers", "CodeMirror-foldgutter", "CodeMirror-lint-markers"],
      // 显示折叠箭头
      foldGutter: true,
      smartIndent: true,
      lineNumbers: true,
    });

    this.cm.setSize("100%", "100%");
    this.setLineWrapping(conf.lineWrapping);
    this.setupFocusAndDropHandler();

    el.classList.remove("hidden");
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

  // 设置软换行。如果设置成功，返回 true
  setLineWrapping(enable: boolean): boolean {
    if (this.cm && this.cm.getOption("lineWrapping") != enable) {
      this.cm.setOption("lineWrapping", enable);
      return true;
    } else {
      return false;
    }
  }

  setClickListener(fn: (_: number) => void) {
    this.clickFn = (_) => {
      // NOTICE: 比实际点击位置小一行
      fn(this.cm.getCursor().line + 1);
    };
    this.cm.on("cursorActivity", this.clickFn);
  }

  setChangesListener(fn: () => void, fnChanges: () => void) {
    this.cm.on("changes", (cm, e) => {
      fnChanges();

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
  private setupFocusAndDropHandler() {
    const hoverHandler = (e: Event) => {
      if (!e) {
        return;
      }

      const el = (e.target as HTMLElement).closest(".CodeMirror");

      if (e.type === "dragover" || e.type === "focus") {
        el?.classList.add("editor-hover");
      } else {
        el?.classList.remove("editor-hover");
      }
    };

    this.cm.on("focus", (_, e) => {
      hoverHandler(e);
    });

    this.cm.on("blur", (_, e) => {
      hoverHandler(e);
    });

    this.cm.on("dragover", (_, e) => {
      hoverHandler(e);
    });

    this.cm.on("drop", (_, e) => {
      // clear all text before drop content is fill in
      this.setText("");
      hoverHandler(e);
    });

    this.cm.on("dragleave", (_, e) => {
      hoverHandler(e);
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

  addClass(lineno: OptionNum, cls: string) {
    if (lineno === undefined) {
      return;
    }
    this.cm.addLineClass(lineno - 1, "wrap", cls);
  }

  removeClass(lineno: OptionNum, cls?: string) {
    if (lineno === undefined) {
      return;
    }
    this.cm.removeLineClass(lineno - 1, "wrap", cls);
  }

  mark(lineno: OptionNum, startPos: number, endPos: number, cls: string) {
    if (lineno === undefined) {
      return;
    }

    const from = { line: lineno - 1, ch: startPos };
    const to = { line: lineno - 1, ch: endPos };
    this.cm.markText(from, to, { className: cls });
  }

  scrollTo(lineno: OptionNum) {
    if (lineno === undefined) {
      return;
    }
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

  reset() {
    for (let i = 1; i < this.getText().length; i++) {
      this.removeClass(i);
    }

    this.cm.getAllMarks().forEach((marker) => {
      marker.clear();
    });

    if (this.clickFn) {
      this.cm.off("cursorActivity", this.clickFn);
    }
  }

  static incCompareVersion() {
    this.compareVersion.value++;
  }

  static isCompared() {
    return this.compareVersion.value > 0 && this.compareVersion.value >= this.changeVersion.value;
  }

  static setSyncScroll(leftEditor: Editor, rightEditor: Editor, conf: Config) {
    leftEditor.cm.on("scroll", function () {
      if (conf.syncScroll && !conf._disableSyncScroll) {
        const scrollInfo = leftEditor.cm.getScrollInfo();
        rightEditor.cm.scrollTo(scrollInfo.left, scrollInfo.top);
      }
    });

    rightEditor.cm.on("scroll", function () {
      if (conf.syncScroll && !conf._disableSyncScroll) {
        const scrollInfo = rightEditor.cm.getScrollInfo();
        leftEditor.cm.scrollTo(scrollInfo.left, scrollInfo.top);
      }
    });
  }
}
