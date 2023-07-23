"use client";
import * as monaco from "monaco-editor";
import { Editor, loader } from "@monaco-editor/react";
import * as jsonc from "jsonc-parser";

// TODO: 指定 CDN 地址，改为 npm
loader.config({
  paths: {
    vs: "https://cdn.staticfile.org/monaco-editor/0.40.0/min/vs",
  },
  // 配置右键菜单使用中文
  "vs/nls": {
    availableLanguages: {
      "*": "zh-cn",
    },
  },
});

export default function MyEditor({ name, editorRef, setAlertMsg }) {
  return (
    <Editor
      language="json"
      height="calc(100vh - 6rem)"
      options={{
        fontSize: 14, // 设置初始字体大小
        scrollBeyondLastLine: false, // 行数超过一屏时才展示滚动条
        automaticLayout: true, // 当编辑器所在的父容器的大小改变时，编辑器会自动重新计算并调整大小
        wordWrap: "on",
        minimap: { enabled: false },
      }}
      onMount={(editor, monaco) => {
        editorRef.current = new EditorRef(name, editor, monaco, setAlertMsg);
        editorRef.current.registerAll();
      }}
      onValidate={(markers) => editorRef.current.validate(markers)}
    />
  );
}

class EditorRef {
  constructor(name, editor, monaco, setAlertMsg) {
    // 编辑器名字。用于输出日志时区分左右两侧的编辑器
    this.name = name;
    // monaco editor 实例
    this.editor = editor;
    // monaco 实例
    this.monaco = monaco;
    // 设置编辑器上方的 alert 信息
    this.setAlertMsg = setAlertMsg;
    // json 字符串解析成 tree 以后的根节点。Node 类型定义见文档：https://github.com/microsoft/node-jsonc-parser
    this.rootNode = null;
  }

  text() {
    return this.editor.getValue().trim();
  }

  setText(text) {
    this.editor.setValue(text);
  }

  // 校验 json valid
  validate(markers) {
    if (markers?.length > 0) {
      const m = markers[0];
      this.setAlertMsg(`!JSON 解析错误：第 ${m.startLineNumber} 行，第 ${m.startColumn} 列`);
    } else {
      this.setAlertMsg("");
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
    console.log(`${this.name} format`);
    return text;
  }

  minify() {
    try {
      const obj = JSON.parse(this.text());
      const text = JSON.stringify(obj, null, 0);
      this.setText(text);
      console.log(`${this.name} minify`);
    } catch (e) {
      // TODO:
      console.log(`${this.name} minify failed: ${e}`);
      // handleError(e, editor === leftEditor ? diff.LEFT : diff.RIGHT);
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

  doPaste(format = false) {
    const text = format ? this.format() : this.text();
    this.rootNode = jsonc.parseTree(text);
  }

  registerAll() {
    this.registerOnPaste();
    this.registerAutoShowMinimap();
    this.registerDropFileHandler();
    this.registerPositionChange();

    // TODO: 监听滚动事件实现同步滚动
    const editor = this.editor;
    this.editor.onDidScrollChange(function (e) {
      console.log("滚动位置：", e.scrollTop);
      // editor.setScrollTop(e._oldScrollTop);
    });
  }

  // 注册粘贴事件处理器
  registerOnPaste() {
    this.editor.onDidPaste(() => {
      this.doPaste(true);
    });
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
          this.doPaste(true);
        };
        reader.readAsText(file);
      }
    });
  }

  // 宽度改变时自动展示或隐藏 minimap
  registerAutoShowMinimap() {
    const widthThreshold = 800;

    this.editor.onDidLayoutChange((e) => {
      const enabled = this.editor.getOption(monaco.editor.EditorOption.minimap).enabled;
      const width = e.width;

      if (width > widthThreshold && !enabled) {
        console.log(`${this.name} enable minimap`);
        this.editor.updateOptions({
          minimap: {
            enabled: true,
          },
        });
      } else if (width < widthThreshold && enabled) {
        console.log(`${this.name} disable minimap`);
        this.editor.updateOptions({
          minimap: { enabled: false },
        });
      }
    });
  }

  // 监听光标改变事件。显示光标停留位置的 json path
  registerPositionChange() {
    this.editor.onDidChangeCursorPosition((e) => {
      // 获取当前光标在整个文档中的偏移量（offset）
      const offset = this.editor.getModel().getOffsetAt(e.position);
      const loc = jsonc.getLocation(this.text(), offset);

      // TODO:
      if (loc.path.length > 0) {
        const node = jsonc.findNodeAtOffset(this.rootNode, offset);
        const value = jsonc.getNodeValue(node);
        console.log("cursor position: ", offset, loc.path, node, value);
      }
    });
  }
}

// TODO: -----------------------------------------------------------------------------------------------------------
function highlightLine(editor, lineNumber, colorClass) {
  const endColumn = editor.getModel().getLineMaxColumn(lineNumber);

  highlight(
    editor,
    {
      startLine: lineNumber,
      startColumn: 1,
      endLine: lineNumber,
      endColumn: endColumn,
    },
    {
      isWholeLine: true,
      linesDecorationsClassName: colorClass,
    }
  );
}

function highlight(editor, range, options) {
  // 定义装饰的选项
  var decoration = {
    range: new monaco.Range(range.startLine, range.startColumn, range.endLine, range.endColumn),
    options: options,
  };

  // 应用装饰
  var decorations = editor.deltaDecorations([], [decoration]);
  return decorations;
}

function handleEditorChange(editor, value, e) {
  console.log("editor onchange", e);
  highlightLine(editorRef.current, 2, "bg-green-100");
}
