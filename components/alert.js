"use client";
import { useState, useEffect } from "react";

export default function MyAlert({ richText }) {
  const [msg, setMsg] = useState("");

  // 防抖：https://www.ruanyifeng.com/blog/2020/09/react-hooks-useeffect-tutorial.html
  useEffect(() => {
    const timerID = setTimeout(() => {
      setMsg(richText);
    }, 100);

    // 下次渲染
    return () => {
      clearTimeout(timerID);
    };
  }, [richText, setMsg]);

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
