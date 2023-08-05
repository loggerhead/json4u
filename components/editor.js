"use client";
import * as monaco from "monaco-editor/esm/vs/editor/editor.api";
import { loader, Editor } from "@monaco-editor/react";
import * as jsonc from "../lib/jsonc-parser/main";
import * as color from "../lib/color";
import * as jsonPointer from "../lib/json-pointer";
import { semanticCompare, DEL, INS, Diff } from "../lib/diff";
import Loading from "../components/loading";
// 查询框的 icon 图标以及折叠图标
import "monaco-editor/esm/vs/base/browser/ui/codicons/codiconStyles";
import "monaco-editor/esm/vs/editor/contrib/symbolIcons/browser/symbolIcons.js";

// NOTICE: 目前删除不了内置的右键菜单项：https://github.com/microsoft/monaco-editor/issues/1567
loader.config({ monaco });

export default function MyEditor({ height, editorRef, setAlert, adjustAfterCompare, doPair }) {
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
        editorRef.current = new EditorRef(editor, monaco, setAlert, adjustAfterCompare);
        editorRef.current.init();
        doPair();
      }}
      onValidate={(markers) => editorRef.current.validate(markers)}
      onChange={() => editorRef.current.clearDecorations()}
    />
  );
}

class EditorRef {
  constructor(editor, monaco, setAlert, adjustAfterCompare) {
    // monaco editor 实例
    this.editor = editor;
    // monaco 实例
    this.monaco = monaco;
    // 设置编辑器上方的 alert 信息
    this.setAlert = setAlert;
    // 完成比较后，对两边编辑器的位置做调整
    this.adjustAfterCompare = adjustAfterCompare;
    // 滚动中吗？
    this.scrolling = false;
    // 启用同步滚动？
    this.enableSyncScroll = true;
    // 菜单项。key: value => 函数名: 菜单属性
    this.menuItems = new Map();
  }

  model() {
    return this.editor.getModel();
  }

  text() {
    return this.editor.getValue();
  }

  setText(text) {
    this.editor.setValue(text);
  }

  range(offset, length) {
    const model = this.model();
    return monaco.Range.fromPositions(model.getPositionAt(offset), model.getPositionAt(offset + length));
  }

  // 校验 json valid
  validate(markers) {
    if (markers?.length > 0) {
      const m = markers[0];
      const props = {
        msg: `JSON 解析错误：第 ${m.startLineNumber} 行，第 ${m.startColumn} 列`,
        color: "red",
      };
      this.setAlert(props);
    } else {
      this.setAlert({});
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
    var text = this.text();
    const edits = jsonc.format(text, undefined, {
      tabSize: 4,
      insertSpaces: true,
      eol: "",
    });

    text = jsonc.applyEdits(text, edits);
    this.setText(text);
    return text;
  }

  minify() {
    try {
      const obj = JSON.parse(this.text());
      const text = JSON.stringify(obj, null, 0);
      this.setText(text);
    } catch (e) {
      this.setAlert({ msg: `最小化失败：${e}`, color: "red" });
    }
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

  compare() {
    const ltext = this.leftEditor.text();
    const rtext = this.rightEditor.text();

    // 进行比较
    let { diffs, isTextCompare } = semanticCompare(ltext, rtext);
    // 防御性编程。没 bug 的话只有 DEL 和 INS
    diffs = diffs.filter((d) => d.diffType == DEL || d.diffType == INS);
    // console.log(Diff.fillText(diffs, this.leftEditor, this.rightEditor));

    this.showResultMsg(diffs, isTextCompare);
    this.highlight(this.leftEditor, this.rightEditor, diffs);
    this.adjustAfterCompare();
  }

  // 提示用户差异数量
  showResultMsg(diffs, isTextCompare) {
    let msgs = [];
    let colors = [];

    if (isTextCompare) {
      msgs.push("无效 JSON，进行文本比较。");
      colors.push("yellow");
    }

    if (diffs.length == 0) {
      msgs.push("两边没有差异");
      colors.push("green");
    } else {
      const delN = diffs.filter((d) => d.diffType == DEL)?.length;
      const insN = diffs.filter((d) => d.diffType == INS)?.length;
      msgs.push(`${delN} 删除，${insN} 新增`);
      colors.push("blue");
    }

    const msg = msgs.join(" ");
    const c = color.max(colors);
    this.setAlert({ msg: msg, color: c });
  }

  // 高亮
  highlight(leftEditor, rightEditor, diffs) {
    const leftDecorations = [];
    const rightDecorations = [];

    for (const { diffType, offset, length, highlightLine } of diffs) {
      const editor = diffType == DEL ? leftEditor : rightEditor;
      const decorations = diffType == DEL ? leftDecorations : rightDecorations;
      const colorClass = color.getColorClass(diffType, highlightLine);
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
      this.format();

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

  registerMenuItem(name, fnName, groupName, order) {
    const item = {
      id: fnName,
      label: name,
      contextMenuGroupId: groupName,
      contextMenuOrder: order,
      // 只能通过引用来调用，否则不生效
      run: function (ed) {
        ed._ref[fnName]();
      },
    };

    // 用于删除 action
    item.disposable = this.editor.addAction(item);
    this.menuItems.set(fnName, item);
  }

  // NOTICE: 删除不了内置的菜单项：https://github.com/microsoft/monaco-editor/issues/1567
  registerMenuItems() {
    let order = -100;
    this.registerMenuItem("格式化", "format", "navigation", order++);
    this.registerMenuItem("最小化", "minify", "navigation", order++);
    this.registerMenuItem("转义", "escape", "navigation", order++);
    this.registerMenuItem("去转义", "unescape", "navigation", order++);
    this.registerMenuItem("关闭同步滚动", "toggleSyncScroll", "modification", order++);
  }

  // 注册粘贴事件处理器
  registerOnPaste() {
    this.editor.onDidPaste((e) => this.doPaste(e));
  }

  // 注册拖拽事件处理器，支持拖拽文件到编辑器上
  registerDropFileHandler() {
    this.editor.getDomNode().addEventListener("drop", (e) => {
      e.preventDefault();
      var file = e.dataTransfer.files[0];

      if (file) {
        // 读取拖拽的文件内容，并设置为编辑器的内容
        var reader = new FileReader();
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
        this.setAlert({ msg: `${jsonPointer.toPointer(loc.path)}`, color: "blue" });
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
