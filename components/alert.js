"use client";
import { useRef, useMemo } from "react";

// 需要将枚举值定义出来，否则编译器不知道使用了哪些 class，就不会编译，导致样式不生效
const _ = ["alert-blue", "alert-green", "alert-yellow", "alert-red", "alert-hl-red"];
// 组件两次间隔不到 100ms 时，不更新组件
const minUpdateInterval = 100;

export default function MyAlert({ richText }) {
  const prevAlert = useRef({ msg: "", time: 0 });

  const alert = useMemo(() => {
    const now = Date.now();
    const { time } = prevAlert.current;

    if (now - time > minUpdateInterval) {
      prevAlert.current = { msg: richText, time: now };
    }

    return prevAlert.current;
  }, [richText, prevAlert]);

  const { msg } = alert;
  let node =
    typeof window != "undefined" && typeof DOMParser != "undefined"
      ? new DOMParser().parseFromString(msg, "text/xml")
      : undefined;
  const err = node?.querySelector("parsererror");

  // 如果解析失败
  if (err) {
    if (err && msg) {
      console.error(`解析提示文案失败:\n\n${msg}\n\n`, err?.textContent);
    }
    node = undefined;
  }

  return (
    <div className={`text-sm rounded ${msg?.length ? "" : "hidden"}`}>
      {node ? <SpanNode key={`00`} node={node} level={0}></SpanNode> : <></>}
    </div>
  );
}

// 根据 dom 树生成 span 树
function SpanNode({ node, level }) {
  // https://developer.mozilla.org/en-US/docs/Web/API/Node/nodeType
  if (node.nodeType === Node.DOCUMENT_NODE) {
    node = node.childNodes[0];
  }
  const color = node.nodeName;

  return (
    <span key={`${level}0`} className={`py-[3px] ${level === 0 ? "px-2" : ""} alert-${color}`}>
      {Array.from(node?.childNodes).map((node, i) => {
        const key = `${level}${i + 1}`;

        if (node.nodeType === Node.ELEMENT_NODE) {
          return <SpanNode key={key} node={node} level={level + 1}></SpanNode>;
        } else {
          return <span key={key}>{node.textContent}</span>;
        }
      })}
    </span>
  );
}
