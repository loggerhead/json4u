// https://nextjs.org/docs/getting-started/react-essentials#client-components
"use client";

import Editor from "@monaco-editor/react";

export default function MyEditor() {
  const defaultValue = `{
  "foo": "bar"
}`;

  return (
    <div>
      <Editor height="400px" language="json" value={defaultValue} />
    </div>
  );
}
