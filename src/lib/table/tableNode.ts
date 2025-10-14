/**
 * This file implements the `TableNode` class and provides utility functions for traversing the virtual table structure.
 * The `TableNodeImpl` class is the concrete implementation of the `TableNode` interface, representing a single cell
 * in the virtual grid. The functions here allow for the conversion of this tree-like structure into a 2D array,
 * which is essential for rendering the virtualized table.
 */
import { computeTextWidth } from "@/lib/graph/layout";
import { globalStyle } from "./style";
import type { BorderType, TableNode, TableNodeType, TableTree } from "./types";

/**
 * Converts a `TableNode` and its entire sub-tree into a 2D array of `TableNode`s.
 * This is used for debug.
 * @param node The root `TableNode` to convert.
 * @returns A 2D array representing the virtual table.
 */
export function nodeTo2dArray<T = TableNode>(
  node: TableNode,
  apply?: (node: TableNode, row?: number, col?: number) => T,
): T[][] {
  if (node.span === 0) {
    return [];
  }

  const res: T[][] = [];
  apply = apply || ((nd: TableNode) => nd as T);

  // Iterate through each row spanned by the node and retrieve its cells.
  for (let i = 0; i < node.span; i++) {
    res.push(getRow(node, node.row + i, node.span).map((nd, col) => apply(nd, i, col)));
  }

  return res;
}

/**
 * Traverses the linked-list and tree structure of `TableNode`s to collect all cells for a specific row index.
 * @param node The starting `TableNode` (usually the root or a sub-tree root).
 * @param row The row index to retrieve.
 * @returns An array of `TableNode`s that constitute the specified row.
 */
export function getRow(node: TableNode, row: number, rowCnt: number): TableNode[] {
  const res: TableNode[] = [];
  const stack = [node];

  while (stack.length > 0) {
    const nd = stack.pop()!;
    // Traverse horizontally to the next cell in the current row.
    nd.next && stack.push(nd.next);

    if (nd.type === "dummyParent") {
      // If it's a parent, find the correct child head for the target row and traverse it.
      const head = findHead(nd.heads, row)!;
      head && stack.push(head);
      continue;
    }

    // This is a regular cell, add it to the result.
    if (nd.row === row) {
      const borders = nd.borders.filter((b) => !(row === 0 && b === "top") && !(nd.span > 1 && b === "bottom"));
      res.push({ ...nd, borders });
      continue;
    }

    const isLast = row === nd.row + nd.span - 1 && nd.borders.includes("bottom");
    const borders = nd.borders.filter((b) => (b !== "bottom" && b !== "top") || (isLast && b === "bottom"));

    if (nd.type === "header") {
      res.push({ ...nd, borders, type: "dummyHeader" });
    } else if (nd.type === "value") {
      res.push({ ...nd, borders, type: "dummyValue" });
    } else {
      throw new Error(`Unexpected TableNode type: ${JSON.stringify(nd)}`);
    }
  }

  return res;
}

/**
 * Performs a binary search on the `heads` of a parent node to find the child
 * `TableNode` that corresponds to a specific row index.
 * @param heads An array of child head nodes.
 * @param row The target row index.
 * @returns The `TableNode` for the specified row, or `undefined` if not found.
 */
function findHead(heads: TableNode[], row: number): TableNode | undefined {
  let left = 0;
  let right = heads.length - 1;

  while (left <= right) {
    const mid = Math.floor((left + right) / 2);
    const node = heads[mid]!;

    // Check if the target row falls within the span of the current node.
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
  return { grid: [], width: 0, height: 0 };
}

export function isDummyType(t: TableNodeType) {
  return t.startsWith("dummy");
}

export class TableNodeImpl implements TableNode {
  type: TableNodeType;
  text: string;
  row: number;
  span: number;
  width: number;
  level: number;
  borders: BorderType[];
  next?: TableNode;
  heads: TableNode[];
  classNames: string[];
  id?: string;

  constructor(type: TableNodeType) {
    this.type = type;
    this.row = 0;
    this.span = type === "dummyParent" ? 0 : 1; // dummyParent span is calculated later
    this.width = 0;
    this.text = "";
    this.level = 0;
    this.borders = [];
    this.classNames = [];
    this.heads = [];
  }

  /**
   * Sets the text content of the node and calculates its initial width based on the text length.
   * @param t The text content.
   * @returns The `TableNodeImpl` instance for chaining.
   */
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

  setRow(row: number) {
    this.row = row;
    return this;
  }

  setSpan(span: number) {
    this.span = span;
    return this;
  }

  setLevel(lv: number) {
    this.level = lv;
    return this;
  }

  addBorder(border: BorderType | "") {
    if (!border) {
      return this;
    }

    this.borders.push(border);
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
