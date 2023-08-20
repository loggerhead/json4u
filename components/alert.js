import * as color from "../lib/color";

export default function MyAlert({ msg }) {
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
      node = document.createTextNode(msg);
    }
  }

  return <SpanNode key={`00`} node={node} level={0}></SpanNode>;
}

// 根据 dom 树生成 span 树
function SpanNode({ node, level }) {
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
          return <SpanNode key={key} node={node} level={level + 1}></SpanNode>;
        } else {
          return <span key={key}>{node.textContent}</span>;
        }
      })}
    </span>
  );
}
