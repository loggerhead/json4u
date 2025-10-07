import { rootMarker } from "@/lib/idgen";

export type SortType = "asc" | "desc";
export interface ParseOptions {
  nest?: boolean; // Perform nested parsing?
  format?: boolean | "minify"; // Format when stringifying?
  prettyMaxWidth?: number; // The number of characters to use as a reference for prettier formatting.
  tabWidth?: number; // The number of spaces to use for indentation when formatting with prettier.
  sort?: SortType; // The order in which to sort when stringifying.
}

export interface ContextError {
  offset: number;
  length: number;
  context: [string, string, string]; // The error context, including left, errorText, and right.
}

export type NodeType = "object" | "array" | "string" | "number" | "boolean" | "null";

export interface Node {
  id: string; // construct by json pointer with format of `$/a/b/c`
  type: NodeType; // type of node. For property node, it is the type of value.
  offset: number; // offset of rawValue in the whole text
  length: number; // length of rawValue
  keyLength: number; // length of key without quotes (only property node have)
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
  return isIterableType(node.type);
}

export function isIterableType(t: NodeType) {
  return t === "array" || t === "object";
}

export function hasChildren(node: Node | undefined) {
  return !!getChildCount(node);
}

export function getChildCount(node: Node | undefined): number {
  return node?.childrenKeys?.length ?? 0;
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
