"use client";
import * as monaco from "monaco-editor/esm/vs/editor/editor.api";
import { loader, Editor } from "@monaco-editor/react";
import * as jsonc from "../lib/jsonc-parser/main";
import * as color from "../lib/color";
import * as jsonPointer from "../lib/json-pointer";
import { semanticCompare, DEL, INS } from "../lib/diff";
import Loading from "../components/loading";

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
        wordWrap: "on",
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
    diffs = diffs.filter((d) => d.diffType == DEL || d.diffType == INS);

    if (isTextCompare) {
      this.adjustForHighlight(this.leftEditor, this.rightEditor, diffs);
    }

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

  // 调整 diff 以便高亮
  adjustForHighlight(leftEditor, rightEditor, diffs) {
    for (const diff of diffs) {
      const editor = diff.diffType == DEL ? leftEditor : rightEditor;
      const range = editor.range(diff.offset, diff.length);
      const text = editor.model().getValueInRange(range);

      // 末尾换行符不进行高亮，避免接下来一行没有差异但被高亮
      if (text.endsWith("\n")) {
        diff.length--;
      }
    }
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
  doPaste() {
    this.format();

    // 当左右两侧编辑器都有内容时，才进行比较
    if (this.leftEditor?.text().length && this.rightEditor?.text().length) {
      this.compare();
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

    // TODO: 监听滚动事件实现同步滚动
    this.editor.onDidScrollChange(function (e) {
      // console.log("滚动位置：", e.scrollTop);
      // editor.setScrollTop(e._oldScrollTop);
    });

    this.registerMenuItems();
    return this;
  }

  // NOTICE: 删除不了内置的菜单项：https://github.com/microsoft/monaco-editor/issues/1567
  registerMenuItems() {
    let order = -100;

    const register = (name, fnName) => {
      order++;

      this.editor.addAction({
        id: `my.${fnName}`,
        label: name,
        contextMenuGroupId: "navigation",
        contextMenuOrder: order,
        // 只能通过引用来调用，否则不生效
        run: function (ed) {
          ed._ref[fnName]();
        },
      });
    };

    register("格式化", "format");
    register("最小化", "minify");
    register("转义", "escape");
    register("去转义", "unescape");
  }

  // 注册粘贴事件处理器
  registerOnPaste() {
    this.editor.onDidPaste(() => this.doPaste());
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
