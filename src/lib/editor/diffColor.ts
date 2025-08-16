import type { Color } from "@/lib/color";
import { DiffType } from "@/lib/compare";

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

/**
 * Gets the line class for a given diff type.
 * @param diffType - The diff type.
 * @returns The line class.
 */
export function getLineClass(diffType: DiffType) {
  return filterByType(hunkClasses, diffType).lineClass;
}

/**
 * Gets the inline class for a given diff type.
 * @param diffType - The diff type.
 * @returns The inline class.
 */
export function getInlineClass(diffType: DiffType) {
  return filterByType(inlineClasses, diffType).lineClass;
}

/**
 * Gets the margin class for a given diff type.
 * @param diffType - The diff type.
 * @returns The margin class.
 */
export function getMarginClass(diffType: DiffType) {
  return filterByType(hunkClasses, diffType).marginClass;
}

/**
 * Gets the minimap color for a given diff type.
 * @param diffType - The diff type.
 * @returns The minimap color.
 */
export function getMinimapColor(diffType: DiffType) {
  return filterByType(inlineClasses, diffType).rgba;
}

/**
 * Gets the overview ruler color for a given diff type.
 * @param diffType - The diff type.
 * @returns The overview ruler color.
 */
export function getOverviewRulerColor(diffType: DiffType) {
  return filterByType(inlineClasses, diffType).rgba;
}
