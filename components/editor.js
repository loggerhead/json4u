"use client";
import { useRef } from "react";
import * as monaco from "monaco-editor";
import { Editor, loader } from "@monaco-editor/react";

// TODO: 指定 CDN 地址，改为 npm
loader.config({ paths: { vs: "https://cdn.staticfile.org/monaco-editor/0.40.0/min/vs" } });

export default function MyEditor({ name }) {
  const editorRef = useRef(null);
  const height = "calc(100vh - 6rem)";
  // TODO:
  const defaultValue = `{
  "foo": "bar"
}`;

  return (
    <Editor
      height={height}
      language="json"
      value={defaultValue}
      options={{
        fontSize: 14, // 设置初始字体大小
        scrollBeyondLastLine: false, // 行数超过一屏时才展示滚动条
        automaticLayout: true, // 当编辑器所在的父容器的大小改变时，编辑器会自动重新计算并调整大小
        wordWrap: "on",
        minimap: {
          enabled: false,
        },
      }}
      onMount={(editor, monaco) => {
        editorRef.current = editor;
        editor.name = name;
        registerAutoShowMinimap(editor);
        registerDropFileHandler(editor);
      }}
      // onChange={(e) => handleEditorChange(editorRef.current, e)}
    />
  );
}

// 支持拖拽文件到编辑器上
function registerDropFileHandler(editor) {
  editor.getDomNode().addEventListener("drop", (e) => {
    e.preventDefault();
    var file = e.dataTransfer.files[0];

    if (file) {
      // 读取拖拽的文件内容，并设置为编辑器的内容
      var reader = new FileReader();
      reader.onload = (e) => editor.setValue(e.target.result);
      reader.readAsText(file);
    }
  });
}

// 宽度改变时自动展示或隐藏 minimap
function registerAutoShowMinimap(editor) {
  const widthThreshold = 800;

  editor.onDidLayoutChange((e) => {
    const enabled = editor.getOption(monaco.editor.EditorOption.minimap).enabled;
    const width = e.width;

    if (width > widthThreshold && !enabled) {
      console.log(`${editor.name} enable minimap`);
      editor.updateOptions({
        minimap: {
          enabled: true,
        },
      });
    } else if (width < widthThreshold && enabled) {
      console.log(`${editor.name} disable minimap`);
      editor.updateOptions({
        minimap: {
          enabled: false,
        },
      });
    }
  });
}

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
