import { DiffType } from "@/lib/compare";

type RGB = `rgb(${number}, ${number}, ${number})`;
type RGBA = `rgba(${number}, ${number}, ${number}, ${number})`;
type HEX = `#${string}`;
type Color = RGB | RGBA | HEX;

interface DiffStyle {
  type: DiffType;
  lineClass: string;
  marginClass?: string;
  rgba: Color;
}

// TODO: use a more smart way to manage the color
const hunkClasses: Readonly<DiffStyle[]> = [
  {
    type: "del",
    lineClass: "line-del",
    marginClass: "margin-del",
    rgba: "#ff9b9533",
  },
  {
    type: "ins",
    lineClass: "line-ins",
    marginClass: "margin-ins",
    rgba: "#82ffa433",
  },
];

const inlineClasses: Readonly<DiffStyle[]> = [
  {
    type: "del",
    lineClass: "inline-del",
    rgba: "#ff818266",
  },
  {
    type: "ins",
    lineClass: "inline-ins",
    rgba: "#2ddf5966",
  },
];

function filterByType(classes: Readonly<DiffStyle[]>, t: DiffType): DiffStyle {
  for (const c of classes) {
    if (c.type === t) {
      return c;
    }
  }
  return undefined as unknown as DiffStyle;
}

export function getLineClass(diffType: DiffType) {
  return filterByType(hunkClasses, diffType).lineClass;
}

export function getInlineClass(diffType: DiffType) {
  return filterByType(inlineClasses, diffType).lineClass;
}

export function getMarginClass(diffType: DiffType) {
  return filterByType(hunkClasses, diffType).marginClass;
}

export function getMinimapColor(diffType: DiffType) {
  return filterByType(inlineClasses, diffType).rgba;
}

export function getOverviewRulerColor(diffType: DiffType) {
  return filterByType(inlineClasses, diffType).rgba;
}
