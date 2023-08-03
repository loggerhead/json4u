"use client";

export default function MyButton({ onClick, children }) {
  return (
    <button onClick={onClick} className="button-action">
      {children}
    </button>
  );
}

export function FormatButton({ editorRef }) {
  return <MyButton onClick={() => editorRef.current.format()}>格式化</MyButton>;
}

export function MinifyButton({ editorRef }) {
  return <MyButton onClick={() => editorRef.current.minify()}>最小化</MyButton>;
}

export function EscapeButton({ editorRef }) {
  return <MyButton onClick={() => editorRef.current.escape()}>转义</MyButton>;
}

export function UnescapeButton({ editorRef }) {
  return <MyButton onClick={() => editorRef.current.unescape()}>去转义</MyButton>;
}

export function CompareButton({ editorRef, setHidden }) {
  return <MyButton onClick={() => editorRef.current.compare()}>比较</MyButton>;
}
