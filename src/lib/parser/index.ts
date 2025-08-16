import { parseJSON } from "./parse";
import { isEquals } from "./tree";

export * from "./node";
export * from "./parse";
export * from "./tree";

/**
 * Checks if two JSON strings are equal.
 * @param jsonStr1 - The first JSON string.
 * @param jsonStr2 - The second JSON string.
 * @returns True if the two JSON strings are equal, false otherwise.
 */
export function isEqual(jsonStr1: string, jsonStr2: string) {
  const t1 = parseJSON(jsonStr1);
  const t2 = parseJSON(jsonStr2);
  return isEquals(t1, t2);
}
