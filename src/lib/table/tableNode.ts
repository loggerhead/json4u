import { computeTextWidth } from "@/lib/graph/layout";
import { globalStyle } from "./style";
import type { TableNode, TableNodeType, TableTree } from "./types";

export class TableNodeImpl implements TableNode {
  // The type of the node, which determines how it is rendered in the table.
  type: TableNodeType;
  text: string;
  row: number;
  span: number;
  width: number;
  next?: TableNode;
  // first column node of children
  heads: TableNode[];
  classNames: string[];
  id?: string;

  constructor(type: TableNodeType, row?: number) {
    this.type = type;
    this.row = row ?? 0;
    this.span = type === "dummyParent" ? 0 : 1;
    this.width = 0;
    this.text = "";
    this.classNames = [];
    this.heads = [];
  }

  setText(t: string) {
    this.text = t;

    if (t) {
      const width = computeTextWidth(t, globalStyle.fontWidth) + globalStyle.padding;
      this.width = Math.min(width, globalStyle.maxCellWidth);
    } else {
      this.width = 0;
    }
    return this;
  }

  setWidth(w: number) {
    this.width = w;
    return this;
  }

  setSpan(span: number) {
    this.span = span;
    return this;
  }

  setId(id: string | undefined) {
    this.id = id;
    return this;
  }

  setClass(...clss: string[]) {
    this.classNames.push(...clss);
    return this;
  }

  setNext(nd: TableNode) {
    this.next = nd;
    return this;
  }

  setHeads(nodes: TableNode[]) {
    this.heads = nodes;
    return this;
  }
}

export function getRow(node: TableNode, row: number): TableNode[] {
  const res: TableNode[] = [];
  const stack = [node];

  while (stack.length > 0) {
    const nd = stack.pop()!;
    nd.next && stack.push(nd.next);

    if (nd.type === "dummyParent") {
      const head = findHead(nd.heads, row)!;
      head && stack.push(head);
    } else {
      res.push(nd);
    }
  }

  return res;
}

export function nodeTo2dArray(node: TableNode): TableNode[][] {
  if (node.span === 0) {
    return [];
  }

  const res: TableNode[][] = [];

  for (let i = 0; i < node.span; i++) {
    res.push(getRow(node, node.row + i));
  }

  return res;
}

function findHead(heads: TableNode[], row: number): TableNode | undefined {
  let left = 0;
  let right = heads.length - 1;

  while (left <= right) {
    const mid = Math.floor((left + right) / 2);
    const node = heads[mid]!;

    if (node.row <= row && row < node.row + node.span) {
      return node;
    }

    if (row < node.row) {
      right = mid - 1;
    } else {
      left = mid + 1;
    }
  }

  return;
}

export function newTableTree(): TableTree {
  return { root: new TableNodeImpl("dummyParent"), width: 0, height: 0 };
}
