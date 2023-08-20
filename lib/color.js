import { DEL, INS } from "./diff";
export { DEL, INS };

const lineClasses = [
  [DEL, "line-del", "#fca5a54d"],
  [INS, "line-ins", "#86efac4d"],
];
const inlineClasses = [
  [DEL, "inline-del", "#fb6c6c80"],
  [INS, "inline-ins", "#22de6680"],
];

function getVV(classes, v) {
  for (const vv of classes) {
    if (vv.includes(v)) {
      return vv;
    }
  }

  return [];
}

export function getColorClass(diffType, highlightLine) {
  const classes = highlightLine ? lineClasses : inlineClasses;
  return getVV(classes, diffType)[1];
}

export function getLineColorClass(colorClass) {
  return (colorClass.includes("del") ? lineClasses[0] : lineClasses[1])[1];
}

export function getMinimapColor(colorClass) {
  let vv = getVV(lineClasses, colorClass);
  if (vv?.length > 0) {
    return vv[2];
  }

  vv = getVV(inlineClasses, colorClass);
  return vv[2];
}

export function getOverviewRulerColor(colorClass) {
  return (colorClass.includes("del") ? inlineClasses[0] : inlineClasses[1])[2];
}

// 比较颜色优先级，返回优先级最高的颜色
export function max(colors) {
  const priority = ["red", "yellow", "blue", "green", "black"];

  for (const c of priority) {
    if (colors.includes(c)) {
      return c;
    }
  }

  return priority[priority.length - 1];
}

export function matchColorTags(text) {
  const reTag = /<\/?\w+>/g;
  // 计算需要展示的背景色
  const colors = [...text.matchAll(reTag)].map((tag) =>
    tag.toString().replace("<", "").replace(">", "").replace("/", "")
  );
  text = text.replace(reTag, "");
  return [text, colors];
}
