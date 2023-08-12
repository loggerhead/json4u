"use client";
import * as monaco from "monaco-editor/esm/vs/editor/editor.api";
import { loader, Editor } from "@monaco-editor/react";
import * as jsonc from "../lib/jsonc-parser/main";
import * as color from "../lib/color";
import { urlToJsonString } from "../lib/url";
import * as format from "../lib/format";
import * as pointer from "../lib/pointer";
import { semanticCompare, Diff, DEL, INS } from "../lib/diff";
import * as parser from "../lib/parser";
import Loading from "../components/loading";
// 查询框的 icon 图标以及折叠图标
import "monaco-editor/esm/vs/base/browser/ui/codicons/codiconStyles";
import "monaco-editor/esm/vs/editor/contrib/symbolIcons/browser/symbolIcons.js";

// NOTICE: 目前删除不了内置的右键菜单项：https://github.com/microsoft/monaco-editor/issues/1567
loader.config({ monaco });

export default function MyEditor({ height, editorRef, setAlert, setStatusText, adjustAfterCompare, doPair }) {
  return (
    <Editor
      language="json"
      height={height}
      loading={<Loading height={height}></Loading>}
      options={{
        fontSize: 14, // 设置初始字体大小
        scrollBeyondLastLine: false, // 行数超过一屏时才展示滚动条
        automaticLayout: true, // 当编辑器所在的父容器的大小改变时，编辑器会自动重新计算并调整大小
        wordWrap: "off", // 关闭软换行。避免软换行时，点击出现不规则滚动的问题
        minimap: { enabled: false },
      }}
      onMount={(editor, monaco) => {
        editorRef.current = new EditorRef(editor, monaco, setAlert, setStatusText, adjustAfterCompare);
        editorRef.current.init();
        doPair();
      }}
      onValidate={(markers) => editorRef.current.validate(markers)}
      onChange={() => editorRef.current.clearDecorations()}
    />
  );
}

class EditorRef {
  constructor(editor, monaco, setAlert, setStatusText, adjustAfterCompare) {
    // monaco editor 实例
    this.editor = editor;
    // monaco 实例
    this.monaco = monaco;
    // 设置编辑器上方的 alert 文本
    this.setAlert = setAlert;
    // 设置编辑器下方的 status bar 文本
    this.setStatusText = setStatusText;
    // 完成比较后，对两边编辑器的位置做调整
    this.adjustAfterCompare = adjustAfterCompare;
    // 滚动中吗？
    this.scrolling = false;
    // 启用同步滚动？
    this.enableSyncScroll = true;
    // 菜单项。key: value => 函数名: 菜单属性
    this.menuItems = new Map();
    // 比较后的差异（仅当前侧的差异）
    this.diffs = [];
    // 查看上一个差异或下一个差异时，记录的 diff 下标
    this.diffPosition = 0;
  }

  model() {
    return this.editor.getModel();
  }

  text() {
    return this.editor.getValue();
  }

  // 文本发生变更时，清空 diff 高亮和 diffs 信息
  setText(text, reset = true) {
    // 避免 executeEdits 里面 null 导致的报错
    this.editor.setSelection(new monaco.Range(0, 0, 0, 0));
    // 全量替换成新文本
    this.editor.executeEdits(null, [
      {
        text: text,
        range: this.editor.getModel().getFullModelRange(),
      },
    ]);
    // Indicates the above edit is a complete undo/redo change.
    this.editor.pushUndoStop();

    if (reset) {
      this.resetDiffDecorations();
    }
  }

  // 重置 diff 高亮状态
  resetDiffDecorations() {
    this.clearDecorations();
    this.diffs = [];
    this.diffPosition = 0;
  }

  range(offset, length) {
    const model = this.model();
    return monaco.Range.fromPositions(model.getPositionAt(offset), model.getPositionAt(offset + length));
  }

  // 校验 json valid
  validate(markers) {
    if (markers?.length > 0) {
      const { startLineNumber, startColumn } = markers[0];
      this.setAlert(`<red>JSON 解析错误：第 ${startLineNumber} 行，第 ${startColumn} 列</red>`);
    } else {
      this.setAlert("");
    }
  }

  scrollable() {
    return this.scrolling && this.enableSyncScroll;
  }

  toggleSyncScroll() {
    this.leftEditor.enableSyncScroll = !this.enableSyncScroll;
    this.rightEditor.enableSyncScroll = !this.enableSyncScroll;
    this.leftEditor.updateToggleSyncScrollMenu();
    this.rightEditor.updateToggleSyncScrollMenu();
  }

  updateToggleSyncScrollMenu() {
    const action = this.menuItems.get("toggleSyncScroll");
    const label = this.enableSyncScroll ? "关闭同步滚动" : "打开同步滚动";
    // 删除之前的菜单项，再创建新的菜单项
    action.disposable.dispose();
    this.registerMenuItem(label, "toggleSyncScroll", "modification", action.order);
  }

  // 格式化，并返回格式化后的文本。支持格式化非 JSON 字符串
  format() {
    this.setText(format.format(this.text()));
  }

  minify() {
    let text = this.text();
    const [node, errors] = parser.parseJSON(text);

    if (errors?.length) {
      this.setAlert(`<yellow>无效 JSON，尝试最小化：${errors}</yellow>`);
    }

    if (node?.length == text.length || !errors?.length) {
      text = node.stringify();
    } else {
      text = text.replace(/\s/g, "");
    }

    this.setText(text);
  }

  escape() {
    const text = this.text()
      .replace(/[\\]/g, "\\\\")
      .replace(/[\"]/g, '\\"')
      .replace(/[\/]/g, "\\/")
      .replace(/[\b]/g, "\\b")
      .replace(/[\f]/g, "\\f")
      .replace(/[\n]/g, "\\n")
      .replace(/[\r]/g, "\\r")
      .replace(/[\t]/g, "\\t");
    this.setText(text);
  }

  unescape() {
    const text = this.text()
      .replace(/[\\]n/g, "\n")
      .replace(/[\\]'/g, "'")
      .replace(/[\\]"/g, '"')
      .replace(/[\\]&/g, "&")
      .replace(/[\\]r/g, "\r")
      .replace(/[\\]t/g, "\t")
      .replace(/[\\]b/g, "\b")
      .replace(/[\\]f/g, "\f");
    this.setText(text);
  }

  // URL 转 JSON
  urlToJSON() {
    const text = urlToJsonString(this.text());
    this.setText(format.format(text));
  }

  compare() {
    const ltext = this.leftEditor.text();
    const rtext = this.rightEditor.text();

    // 进行比较
    let { diffs, isTextCompare, errors } = semanticCompare(ltext, rtext);
    const [delDiffs, insDiffs] = Diff.classify(diffs);
    this.leftEditor.diffs = delDiffs;
    this.rightEditor.diffs = insDiffs;

    // 高亮 diff
    this.showResultMsg(diffs, isTextCompare, errors);
    this.highlight(this.leftEditor, this.rightEditor, diffs);
    this.adjustAfterCompare();

    // 滚动到第一个 diff
    this.leftEditor.scrollToDiff(delDiffs[0]);
    this.rightEditor.scrollToDiff(insDiffs[0]);
  }

  // 滚动到上一个差异
  scrollToPrevDiff() {
    if (--this.diffPosition < 0) {
      this.diffPosition = this.diffs.length - 1;
    }
    this.scrollToDiff(this.diffs[this.diffPosition]);
  }

  // 滚动到下一个差异
  scrollToNextDiff() {
    if (++this.diffPosition > this.diffs.length - 1) {
      this.diffPosition = 0;
    }
    this.scrollToDiff(this.diffs[this.diffPosition]);
  }

  scrollToDiff(diff) {
    if (diff) {
      const range = this.range(diff.offset, 1);
      const lineNumber = range.startLineNumber;
      this.editor.revealPositionInCenter({ lineNumber: lineNumber, column: 1 });
    }
  }

  sort(reverse = false) {
    let text = this.text();
    const [tree, errors] = parser.parseJSON(text);

    if (!errors?.length) {
      text = tree.stringify(reverse ? "desc" : "asc");
      text = format.format(text);
      this.setText(text);
    }
  }

  sortReverse() {
    this.sort(true);
  }

  // 提示用户差异数量
  showResultMsg(diffs, isTextCompare, errors) {
    const msgs = [];

    if (isTextCompare) {
      msgs.push("<yellow>无效 JSON，进行文本比较。</yellow>");
    }

    if (diffs.length == 0) {
      msgs.push("<blue>两边没有差异</blue>");
    } else {
      const delN = diffs.filter((d) => d.type == DEL)?.length;
      const insN = diffs.filter((d) => d.type == INS)?.length;
      msgs.push(`<yellow>${delN} 删除，${insN} 新增</yellow>`);
    }

    this.setAlert(msgs.join(" "));
  }

  // 高亮
  highlight(leftEditor, rightEditor, diffs) {
    const leftDecorations = [];
    const rightDecorations = [];

    for (const { type, offset, length, highlightLine } of diffs) {
      const editor = type == DEL ? leftEditor : rightEditor;
      const decorations = type == DEL ? leftDecorations : rightDecorations;
      const colorClass = color.getColorClass(type, highlightLine);
      const dd = editor.newHighlightDecorations(offset, length, highlightLine, colorClass);
      decorations.push(...dd);
    }

    leftEditor.applyDecorations(leftDecorations);
    rightEditor.applyDecorations(rightDecorations);
  }

  // 粘贴时执行的动作
  doPaste(e = null) {
    // 仅当粘贴替换全部文本时，才执行 paste 相关的动作
    if (e === null || e.range.equalsRange(this.model().getFullModelRange())) {
      const text = format.tryFormat(this.text());
      this.setText(text);

      // 当左右两侧编辑器都有内容时，才进行比较
      if (this.leftEditor?.text().length && this.rightEditor?.text().length) {
        this.compare();
      }
    }
  }

  pair(leftEditor, rightEditor) {
    this.leftEditor = leftEditor;
    this.rightEditor = rightEditor;
  }

  init() {
    // 注入引用到编辑器，供 registerMenuItems 使用
    this.editor._ref = this;

    this.registerOnPaste();
    this.registerAutoShowMinimap();
    this.registerDropFileHandler();
    this.registerPositionChange();
    this.registerOnFocus();
    this.registerOnScroll();
    this.registerMenuItems();
    return this;
  }

  scrollTo(e) {
    if (e.scrollTopChanged || e.scrollLeftChanged) {
      this.editor.setScrollTop(e.scrollTop);
      this.editor.setScrollLeft(e.scrollLeft);
    }
  }

  // 监听 focus 事件以支持同步滚动
  registerOnFocus() {
    const self = this;

    this.editor.onDidFocusEditorText((e) => {
      self.scrolling = true;

      if (self === self.leftEditor && self.rightEditor) {
        self.rightEditor.scrolling = false;
      } else if (self === self.rightEditor && self.leftEditor) {
        self.leftEditor.scrolling = false;
      }
    });
  }

  // 监听滚动事件实现同步滚动
  registerOnScroll() {
    const self = this;

    this.editor.onDidScrollChange((e) => {
      if (self.scrollable() && self === self.leftEditor) {
        self.rightEditor?.scrollTo(e);
      } else if (self.scrollable() && self === self.rightEditor) {
        self.leftEditor?.scrollTo(e);
      }
    });
  }

  registerMenuItem(name, fnName, groupName, order, keybindings = []) {
    const item = {
      id: fnName,
      label: name,
      contextMenuGroupId: groupName,
      contextMenuOrder: order,
      keybindings: keybindings,
      // 只能通过引用来调用，否则不生效
      run: function (ed) {
        try {
          ed._ref[fnName]();
        } catch (e) {
          console.error(e);
        }
      },
    };

    // 用于删除 action
    item.disposable = this.editor.addAction(item);
    this.menuItems.set(fnName, item);
  }

  // NOTICE: 删除不了内置的菜单项：https://github.com/microsoft/monaco-editor/issues/1567
  registerMenuItems() {
    const register = (() => {
      let order = -100;
      return (name, fnName, groupName, keybindings = []) => {
        this.registerMenuItem(name, fnName, groupName, order++, keybindings);
      };
    })();

    register("上一个差异", "scrollToPrevDiff", "navigation", [monaco.KeyMod.Alt | monaco.KeyCode.KeyP]);
    register("下一个差异", "scrollToNextDiff", "navigation", [monaco.KeyMod.Alt | monaco.KeyCode.KeyN]);
    register("格式化", "format", "modification");
    register("最小化", "minify", "modification");
    register("转义", "escape", "modification");
    register("去转义", "unescape", "modification");
    register("排序（顺序）", "sort", "modification");
    register("排序（逆序）", "sortReverse", "modification");
    register("URL转JSON", "urlToJSON", "modification");
    register("关闭同步滚动", "toggleSyncScroll", "settings");
  }

  // 注册粘贴事件处理器
  registerOnPaste() {
    this.editor.onDidPaste((e) => this.doPaste(e));
  }

  // 注册拖拽事件处理器，支持拖拽文件到编辑器上
  registerDropFileHandler() {
    this.editor.getDomNode().addEventListener("drop", (e) => {
      e.preventDefault();
      const file = e.dataTransfer.files[0];

      if (file) {
        // 读取拖拽的文件内容，并设置为编辑器的内容
        const reader = new FileReader();
        reader.onload = (e) => {
          this.editor.setValue(e.target.result);
          this.doPaste();
        };
        reader.readAsText(file);
      }
    });
  }

  // 宽度改变时自动展示或隐藏 minimap
  registerAutoShowMinimap() {
    const widthThreshold = 480;

    this.editor.onDidLayoutChange((e) => {
      const enabled = this.editor.getOption(monaco.editor.EditorOption.minimap).enabled;
      const width = e.width;

      if (width > widthThreshold && !enabled) {
        this.editor.updateOptions({
          minimap: {
            enabled: true,
          },
        });
      } else if (width < widthThreshold && enabled) {
        this.editor.updateOptions({
          minimap: { enabled: false },
        });
      }
    });
  }

  // 监听光标改变事件。显示光标停留位置的 json path
  registerPositionChange() {
    this.editor.onDidChangeCursorPosition((e) => {
      const model = this.model();
      // 获取当前光标在整个文档中的偏移量（offset）
      const offset = model.getOffsetAt(e.position);
      const loc = jsonc.getLocation(this.text(), offset);

      if (loc.path) {
        this.setStatusText(pointer.toPointer(loc.path));
      }
    });
  }

  // 生成高亮的装饰
  newHighlightDecorations(offset, length, highlightLine, colorClass) {
    const model = this.model();
    // 从偏移量和长度生成 Range 对象
    const range = this.range(offset, length);
    // 示例：https://microsoft.github.io/monaco-editor/playground.html#interacting-with-the-editor-line-and-inline-decorations
    // 参数定义：https://microsoft.github.io/monaco-editor/typedoc/interfaces/editor.IModelDecorationOptions.html
    const options = {
      // 高亮整行
      isWholeLine: true,
      // 整行文本的装饰 class
      className: color.getLineColorClass(colorClass),
      // 高亮右侧的 minimap
      minimap: {
        // monaco bug: color 参数不生效
        color: color.getMinimapColor(colorClass),
        // monaco bug: Inline 枚举下 minimap 内容不准确
        position: monaco.editor.MinimapPosition.Gutter,
      },
      // 高亮 minimap 右侧的 overview ruler
      overviewRuler: {
        color: color.getOverviewRulerColor(colorClass),
        position: monaco.editor.OverviewRulerLane.Full,
      },
    };

    const decorations = [
      {
        range: range,
        options: options,
      },
    ];

    if (!highlightLine) {
      decorations.push({
        range: range,
        options: {
          // 行内文本的装饰 class
          inlineClassName: colorClass,
        },
      });
    }

    return decorations;
  }

  // 应用装饰
  applyDecorations(decorations) {
    this.clearDecorations();
    return this.editor.createDecorationsCollection(decorations);
  }

  // 清空装饰
  clearDecorations() {
    const ids = this.model()
      .getAllDecorations()
      .map((d) => d.id);
    return this.editor.deltaDecorations(ids, []);
  }
}
