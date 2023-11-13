export function getLastEditor(leftEditorRef, rightEditorRef) {
  const [l, r] = [leftEditorRef.current, rightEditorRef.current];
  return l.focusTime() >= r.focusTime() ? l : r;
}