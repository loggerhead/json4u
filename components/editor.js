"use client";

import Editor from "@monaco-editor/react";

export default function MyEditor({ enableMinimap = true, height = "calc(100vh - 6rem)" }) {
  const defaultValue = `{
  "foo": "bar"
}`;

  const options = {
    fontSize: 14, // 设置初始字体大小
    scrollBeyondLastLine: false, // 行数超过一屏时才展示滚动条
    automaticLayout: true, // 当编辑器所在的父容器的大小改变时，编辑器会自动重新计算并调整大小
    wordWrap: "on",
    minimap: {
      enabled: enableMinimap,
    },
  };

  return <Editor height={height} language="json" value={defaultValue} options={options} />;
}
