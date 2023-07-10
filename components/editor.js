// https://nextjs.org/docs/getting-started/react-essentials#client-components
"use client";

import Editor from "@monaco-editor/react";

export default function MyEditor({ enableMinimap = true, height = "calc(100vh - 6rem)" }) {
  const defaultValue = `{
  "foo": "bar"
}`;

  const options = {
    minimap: {
      enabled: enableMinimap,
    },
    fontSize: 14, // 设置初始字体大小
  };

  return (
    <div>
      <Editor height={height} language="json" value={defaultValue} options={options} />
    </div>
  );
}
