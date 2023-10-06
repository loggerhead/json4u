import {DEL, INS} from "./compare/diff";

const hunkClasses = [
  // $bg-red
  {
    type: DEL,
    lineClass: "line-del",
    marginClass: "margin-del",
    rgba: "#ff9b9533",
    rgb: "#ffebe9",
  },
  // $bg-green
  {
    type: INS,
    lineClass: "line-ins",
    marginClass: "margin-ins",
    rgba: "#82ffa433",
    rgb: "#e6ffec",
  },
];
const inlineClasses = [
  // $fg-red
  {
    type: DEL,
    lineClass: "inline-del",
    rgba: "#ff818266",
    rgb: "#ffcdcd",
  },
  // $fg-green
  {
    type: INS,
    lineClass: "inline-ins",
    rgba: "#2ddf5966",
    rgb: "#abf2bc",
  },
];

function filterByType(classes, t) {
  for (const c of classes) {
    if (c.type === t) {
      return c;
    }
  }

  return undefined;
}

export function getLineClass(diffType) {
  return filterByType(hunkClasses, diffType).lineClass;
}

export function getInlineClass(diffType) {
  return filterByType(inlineClasses, diffType).lineClass;
}

export function getMarginClass(diffType) {
  return filterByType(hunkClasses, diffType).marginClass;
}

export function getMinimapColor(diffType) {
  return filterByType(inlineClasses, diffType).rgba;
}

export function getOverviewRulerColor(diffType) {
  return filterByType(inlineClasses, diffType).rgba;
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
    tag.toString().replace("<", "").replace(">", "").replace("/", ""),
  );
  text = text.replace(reTag, "");
  return [text, colors];
}

// https://stackoverflow.com/questions/2049230/convert-rgba-color-to-rgb
export function rgba2rgb(srcHex, bgColorHex) {
  const [sR, sG, sB, sA] = hex2rgba(srcHex);
  const [bR, bG, bB, bA] = hex2rgba(bgColorHex);
  const r = Math.round((1 - sA) * bR + sA * sR);
  const g = Math.round((1 - sA) * bG + sA * sG);
  const b = Math.round((1 - sA) * bB + sA * sB);
  return rgba2hex([r, g, b]);
}

export function rgb2rgba(srcHex, bgColorHex, a) {
  const [sR, sG, sB, sA] = hex2rgba(srcHex);
  const [bR, bG, bB, bA] = hex2rgba(bgColorHex);
  let r = Math.round((sR - (1 - a) * bR) / a) % 256;
  let g = Math.round((sG - (1 - a) * bG) / a) % 256;
  let b = Math.round((sB - (1 - a) * bB) / a) % 256;
  if (r < 0) r += 256;
  if (g < 0) g += 256;
  if (b < 0) b += 256;
  return rgba2hex([r, g, b, a]);
}

export function hex2rgba(hex) {
  hex = hex.substring(1);
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  const a = parseInt(hex.substring(6, 8), 16) / 256;
  return [r, g, b, a || 1];
}

export function rgba2hex(rgba) {
  const toHex = (n) => n.toString(16).padStart(2, '0');
  const r = toHex(rgba[0]);
  const g = toHex(rgba[1]);
  const b = toHex(rgba[2]);
  const a = Math.round((rgba[3] || 1) * 256);
  let hex = `#${r}${g}${b}`;

  if (a < 256) {
    hex += toHex(a);
  }
  return hex;
}
