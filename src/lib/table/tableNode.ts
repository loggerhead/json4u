/**
 * This file implements the `TableNode` class and provides utility functions for traversing the virtual table structure.
 * The `TableNodeImpl` class is the concrete implementation of the `TableNode` interface, representing a single cell
 * in the virtual grid. The functions here allow for the conversion of this tree-like structure into a 2D array,
 * which is essential for rendering the virtualized table.
 */
import { computeTextWidth } from "@/lib/graph/layout";
import { globalStyle } from "./style";
import type { BorderType, TableNode, TableNodeType } from "./types";

export class TableNodeImpl implements TableNode {
  type: TableNodeType;
  id: string;
  text: string;
  row: number;
  span: number;
  width: number;
  level: number;
  borders: BorderType[];
  parent?: TableNode;
  next?: TableNode;
  heads: TableNode[];
  classNames: string[];
  x: number;
  y: number;

  constructor(type: TableNodeType) {
    this.type = type;
    this.id = "";
    this.row = 0;
    this.span = type === "dummyTable" ? 0 : 1; // dummyTable span is calculated later
    this.width = 0;
    this.text = "";
    this.level = 0;
    this.x = 0;
    this.y = 0;
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
      // 1 is border width
      const width = computeTextWidth(t, globalStyle.fontWidth) + globalStyle.padding + 1;
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
    this.y = row * globalStyle.rowHeight;
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

  setId(id: string) {
    this.id = id;
    return this;
  }

  setClass(...classNames: string[]) {
    this.classNames.push(...classNames);
    return this;
  }

  setParent(nd: TableNode) {
    this.parent = nd;
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
