"use client";
import { useRef, useMemo } from "react";
import * as color from "../lib/color";

export default function StatusBar({ texts }) {
  const cacheMap = useRef({});
  const textsMap = useMemo(() => {
    let obj = Object.assign(cacheMap.current, texts);

    obj = Object.entries(obj).reduce((obj, [key, value]) => {
      if (typeof value === "string") {
        if (value) {
          obj[key] = value;
        } else {
          delete obj[key];
        }
      }
      return obj;
    }, {});

    if (obj[0] === undefined) {
      obj[0] = "";
    }

    cacheMap.current = obj;
    return obj;
  }, [cacheMap, texts]);

  const keys = Object.keys(textsMap).sort();
  const leftKeys = keys.filter((key) => key.startsWith("l"));
  const rightKeys = keys.filter((key) => key.startsWith("r"));
  const genAlerts = (keys) => {
    return keys.map((key, i) => {
      let classes = ["px-2.5 py-0.5"];
      classes.push(i < keys.length - 1 ? "statusbar-sep" : "");
      classes = classes.filter((c) => c);

      return (
        <div key={key} className={classes.join(" ")}>
          <BarStub msg={textsMap[key]}></BarStub>
        </div>
      );
    });
  };

  return (
    <div className="flex h-[22px] text-[12px] border-[0.5px] border-t-0 border-solid border-color statusbar">
      {genAlerts(leftKeys)}
      <div className="grow"></div>
      {genAlerts(rightKeys)}
    </div>
  );
}

function BarStub({ msg }) {
  let node;

  if (typeof window != "undefined" && typeof DOMParser != "undefined") {
    const [pureMsg, colors] = color.matchColorTags(msg);

    if (pureMsg && colors.length) {
      node = new DOMParser().parseFromString(msg, "text/xml");
      const err = node?.querySelector("parsererror");

      // 如果解析失败
      if (pureMsg && err) {
        node = undefined;
        console.error(`文本节点解析错误:\n\n${msg}\n\n`, err?.textContent);
      }
    }

    if (node === undefined) {
      node = document.createTextNode(pureMsg);
    }
  }

  return <BarStubNode key={`00`} node={node} level={0}></BarStubNode>;
}

// 根据 dom 树生成 span 树
function BarStubNode({ node, level }) {
  if (!node || node.nodeType == Node.TEXT_NODE) {
    const text = node?.textContent || "";
    return <span key={`${level}`}>{text}</span>;
  }

  // https://developer.mozilla.org/en-US/docs/Web/API/Node/nodeType
  if (node.nodeType === Node.DOCUMENT_NODE) {
    node = node.childNodes[0];
  }
  const color = node.nodeName;

  return (
    <span key={`${level}0`} className={`alert-${color}`}>
      {Array.from(node?.childNodes).map((node, i) => {
        const key = `${level}${i + 1}`;

        if (node.nodeType === Node.ELEMENT_NODE) {
          return <BarStubNode key={key} node={node} level={level + 1}></BarStubNode>;
        } else {
          return <span key={key}>{node.textContent}</span>;
        }
      })}
    </span>
  );
}
