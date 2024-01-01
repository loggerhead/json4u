import {Button} from '@arco-design/web-react';
import {useSelector} from "react-redux";
import {lastEditorSelector, leftEditorSelector, rightEditorSelector} from "@/lib/store";

export function MyButton({onClick, children}) {
  return (
    <Button size="mini" style={{
      color: "black",
      fontWeight: "450",
    }} onClick={onClick}>{children}</Button>
  );
}

export function FormatButton() {
  const lastEditor = useSelector(lastEditorSelector);
  return <MyButton onClick={() => lastEditor.format()}>格式化</MyButton>;
}

export function MinifyButton() {
  const lastEditor = useSelector(lastEditorSelector);
  return <MyButton onClick={() => lastEditor.minify()}>最小化</MyButton>;
}

export function CompareButton() {
  const rightEditor = useSelector(rightEditorSelector);
  return <MyButton onClick={() => rightEditor.compare()}>比较</MyButton>;
}

export function TextCompareAfterSortButton() {
  const leftEditor = useSelector(leftEditorSelector);
  const rightEditor = useSelector(rightEditorSelector);

  return <MyButton onClick={() => {
    leftEditor.sort();
    rightEditor.sort();
    rightEditor.compare(true);
  }}>排序后文本比较</MyButton>;
}
