export default function MyButton({onClick, children}) {
  return (
    <button onClick={onClick} className="button-action">
      {children}
    </button>
  );
}

export function FormatButton({leftEditorRef, rightEditorRef}) {
  return <MyButton onClick={() => getLastEditor(leftEditorRef, rightEditorRef).format()}>格式化</MyButton>;
}

export function MinifyButton({leftEditorRef, rightEditorRef}) {
  return <MyButton onClick={() => getLastEditor(leftEditorRef, rightEditorRef).minify()}>最小化</MyButton>;
}

export function EscapeButton({leftEditorRef, rightEditorRef}) {
  return <MyButton onClick={() => getLastEditor(leftEditorRef, rightEditorRef).escape()}>转义</MyButton>;
}

export function UnescapeButton({leftEditorRef, rightEditorRef}) {
  return <MyButton onClick={() => getLastEditor(leftEditorRef, rightEditorRef).unescape()}>去转义</MyButton>;
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

function getLastEditor(leftEditorRef, rightEditorRef) {
  const [l, r] = [leftEditorRef.current, rightEditorRef.current];
  return l.focusTime() >= r.focusTime() ? l : r;
}