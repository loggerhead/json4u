"use client";
import {Button, Message} from '@arco-design/web-react';
import {useSelector} from "react-redux";
import {lastActionSelector, lastEditorSelector, leftEditorSelector, rightEditorSelector} from "@/lib/store";
import {IconShareInternal} from "@arco-design/web-react/icon";
import {useState} from "react";

export function MyButton({onClick, children, loading}) {
  return (
    <Button size="mini" style={{
      color: "black",
      fontWeight: "450",
    }} loading={loading} onClick={onClick}>{children}</Button>
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
    rightEditor.compare({needTextCompare: true});
  }}>排序后文本比较</MyButton>;
}

export function ShareButton() {
  const host = process.env.NEXT_PUBLIC_HOST || "https://json4u.com";
  const leftEditor = useSelector(leftEditorSelector);
  const rightEditor = useSelector(rightEditorSelector);
  const action = useSelector(lastActionSelector);
  const [loading, setLoading] = useState(false);

  return <MyButton loading={loading} onClick={async () => {
    setLoading(true);
    const left = leftEditor.text();
    const right = rightEditor.text();

    if (!left && !right) {
      setLoading(false);
      Message.error(`创建分享链接失败: 输入为空`);
      return;
    }

    fetch('https://api.json4u.com/api/share', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({
        left: left,
        right: right,
        lastAction: action || {},
      }),
    })
      .then((resp) => resp.json())
      .then(async ({id, ttl}) => {
        const days = Math.floor(ttl / 86400);
        const url = `${host}/share/${id}`;

        try {
          await navigator.clipboard.writeText(url);
          Message.success(`已复制分享链接（有效期${days}天）: ${url}`);
        } catch (e) {
          Message.error(`复制分享链接失败: ${url}`);
        }
      })
      .catch((e) => Message.error(`创建分享链接失败: ${e}`))
      .finally(() => setLoading(false));
  }}>{!loading && <IconShareInternal/>}分享</MyButton>;
}
