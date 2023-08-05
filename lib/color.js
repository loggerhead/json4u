import { DEL, INS } from "./diff";
export { DEL, INS };

const lineClasses = [
  [DEL, "line-del", "rgba(252, 165, 165, 0.3)"],
  [INS, "line-ins", "rgba(134, 239, 172, 0.3)"],
];
const inlineClasses = [
  [DEL, "inline-del", "rgba(251, 108, 108, 0.5)"],
  [INS, "inline-ins", "rgba(34, 222, 102, 0.5)"],
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
  const priority = ["green", "blue", "yellow", "red"];

  for (const c of priority.reverse()) {
    if (colors.includes(c)) {
      return c;
    }
  }

  return "blue";
}
