import type { RevealTarget } from "@/lib/graph/types";
import type { TableNodeType, TableGrid } from "./types";

export function tableNodeTypeToRevealTarget(t: TableNodeType): RevealTarget {
  switch (t) {
    case "key":
    case "dummyKey":
      return "key";
    case "value":
    case "dummyValue":
      return "value";
    case "index":
    case "dummyIndex":
      return "keyValue";
    case "header":
    case "dummyHeader":
    case "leftHeaderTable":
    case "topHeaderTable":
      return "graphNode";
  }
}

export function toDummyType(t: TableNodeType): TableNodeType {
  switch (t) {
    case "key":
      return "dummyKey";
    case "index":
      return "dummyIndex";
    case "header":
    case "value":
      return "dummyValue";
    default:
      return t;
  }
}

export function isDummyType(t: TableNodeType) {
  return t.startsWith("dummy");
}

export function isTableType(t: TableNodeType) {
  return t.endsWith("Table");
}

export function newTableGrid(): TableGrid {
  return { grid: [], posMap: new Map(), width: 0, height: 0 };
}
