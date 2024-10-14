import { rootMarker } from "@/lib/idgen";

export type SortType = "asc" | "desc";
export interface ParseOptions {
  nest?: boolean; // 进行嵌套解析吗？
  format?: boolean | "minify"; // stringify 时进行格式化吗？
  prettyMaxWidth?: number; // prettier 格式化参考的字符数
  tabWidth?: number; // prettier 格式化时，缩进的空白数
  sort?: SortType; // 指定 stringify 排序的顺序
}

export interface ContextError {
  offset: number;
  length: number;
  context: [string, string, string]; // 错误上下文，包含 left, errorText, right
}

export type NodeType = "object" | "array" | "string" | "number" | "boolean" | "null";

export interface Node {
  id: string; // construct by json pointer with format of `$/a/b/c`
  type: NodeType;
  offset: number; // offset of rawValue in the whole text
  length: number; // length of rawValue
  boundOffset: number; // offset of bounding in the whole text
  boundLength: number; // length of bounding
  value?: any; // value with type (only leaf node have)
  rawValue?: string; // raw value in string type
  childrenKeys?: string[];
  childrenKey2Id?: Record<string, string>; // key to id
}

export function isRoot(node: Node) {
  return node.id === rootMarker;
}

export function isIterable(node: Node) {
  return node.type === "array" || node.type === "object";
}

export function hasChildren(node: Node | undefined) {
  return !!node?.childrenKeys?.length;
}

export function getChildrenKeys(node: Node): string[] {
  return node?.childrenKeys ?? [];
}

export function getChildId(node: Node, key: string): string {
  return (node.childrenKey2Id ?? {})[key];
}

export function getRawValue(node: Node): string | undefined {
  if (node.rawValue !== undefined) return node.rawValue;
  if (node.value !== undefined) return node.value;
  return undefined;
}

export function computeAndSetBoundLength(node: Node) {
  node.boundLength = node.offset + node.length - (node.boundOffset ?? 0);
}
