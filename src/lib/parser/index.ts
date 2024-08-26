import { parseJSON } from "./parse";
import { isEquals } from "./tree";

export * from "./node";
export * from "./parse";
export * from "./tree";

export function isEqual(jsonStr1: string, jsonStr2: string) {
  const t1 = parseJSON(jsonStr1);
  const t2 = parseJSON(jsonStr2);
  return isEquals(t1, t2);
}
