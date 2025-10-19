import type { RevealTarget } from "@/lib/graph/types";
import type { TableNodeType, TableTree } from "./types";

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
    case "dummyTable":
      return "graphNode";
  }
}

export function toDummyType(t: TableNodeType): TableNodeType {
  switch (t) {
    case "key":
      return "dummyKey";
    case "value":
      return "dummyValue";
    case "index":
      return "dummyIndex";
    case "header":
      return "dummyHeader";
    default:
      return t;
  }
}

export function isDummyType(t: TableNodeType) {
  return t.startsWith("dummy");
}

export function newTableTree(): TableTree {
  return { grid: [], posMap: new Map(), width: 0, height: 0 };
}
