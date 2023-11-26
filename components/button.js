import {Button} from '@arco-design/web-react';
import {getLastEditor} from '@/features/ctxSlice';
import {useSelector} from "react-redux";

export function MyButton({onClick, children}) {
  return (
    <Button size="mini" style={{
      color: "black",
      fontWeight: "450",
    }} onClick={onClick}>{children}</Button>
  );
}

export function FormatButton() {
  const ctx = useSelector((state) => state.ctx);
  return <MyButton onClick={() => getLastEditor(ctx.leftEditor, ctx.rightEditor).format()}>格式化</MyButton>;
}

export function MinifyButton() {
  const ctx = useSelector((state) => state.ctx);
  return <MyButton onClick={() => getLastEditor(ctx.leftEditor, ctx.rightEditor).minify()}>最小化</MyButton>;
}

export function CompareButton() {
  const ctx = useSelector((state) => state.ctx);
  return <MyButton onClick={() => ctx.rightEditor.compare()}>比较</MyButton>;
}

export function TextCompareAfterSortButton() {
  const ctx = useSelector((state) => state.ctx);

  return <MyButton onClick={() => {
    ctx.leftEditor.sort();
    ctx.rightEditor.sort();
    ctx.rightEditor.compare(true);
  }}>排序后文本比较</MyButton>;
}
