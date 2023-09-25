export default function MyButton({onClick, children}) {
  return (
    <button onClick={onClick} className="button-action">
      {children}
    </button>
  );
}

export function FormatButton({editorRef}) {
  return <MyButton onClick={() => editorRef.current.format()}>格式化</MyButton>;
}

export function MinifyButton({editorRef}) {
  return <MyButton onClick={() => editorRef.current.minify()}>最小化</MyButton>;
}

export function EscapeButton({editorRef}) {
  return <MyButton onClick={() => editorRef.current.escape()}>转义</MyButton>;
}

export function UnescapeButton({editorRef}) {
  return <MyButton onClick={() => editorRef.current.unescape()}>去转义</MyButton>;
}

export function CompareButton({editorRef}) {
  return <MyButton onClick={() => editorRef.current.compare()}>比较</MyButton>;
}

export function TextCompareAfterSortButton({leftEditorRef, rightEditorRef}) {
  return <MyButton onClick={() => {
    leftEditorRef.current.sort();
    rightEditorRef.current.sort();
    rightEditorRef.current.compare(true);
  }}>排序后文本比较</MyButton>;
}
