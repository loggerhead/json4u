import { DEL, INS } from "./diff";
export { DEL, INS };

const lineClasses = [
  [DEL, "line-del", "rgba(252, 165, 165, 0.3)"],
  [INS, "line-ins", "rgba(134, 239, 172, 0.3)"],
];
const inlineClasses = [
  [DEL, "inline-del", "rgb(252, 165, 165)"],
  [INS, "inline-ins", "rgb(134, 239, 172)"],
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
