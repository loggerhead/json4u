/**
 * This file implements the `TableNode` class and provides utility functions for traversing the virtual table structure.
 * The `TableNode` class is the concrete implementation of the `TableNode` interface, representing a single cell
 * in the virtual grid. The functions here allow for the conversion of this tree-like structure into a 2D array,
 * which is essential for rendering the virtualized table.
 */
import { computeTextWidth } from "@/lib/graph/layout";
import { pull } from "lodash-es";
import { globalStyle } from "./style";
import type { BorderFlag, CellType, TableCell, TableNodeType } from "./types";
import { isTableType } from "./utils";

/**
 * Represents a single virtual cell in the table. Instead of a DOM element, it's a data object
 * containing all necessary information for rendering, such as content, size, and position.
 */
export class TableNode {
  // The type of the node, determining its role and appearance.
  type: TableNodeType;
  // The starting row index of this cell in the virtual grid, representing the global absolute row.
  row: number;
  // The number of rows this cell spans (rowSpan).
  span: number;
  // The width of this cell in pixels.
  width: number;
  // The text content to be displayed in the cell.
  text: string;
  /**
   * A pointer to the parent `TableNode` in the hierarchy. This is crucial for layout adjustments,
   * such as allowing a child node to calculate its width relative to its parent's dimensions.
   * It is only set for nodes that are part of a larger structure, like key-value pairs in an object
   * or rows in an array.
   */
  parent?: TableNode;
  /**
   * A pointer to the next cell in the same row, forming a singly linked list of cells for that row.
   * This is used to iterate through the cells of a row during the grid-filling process.
   */
  right?: TableNode;
  /**
   * A pointer to the cell directly above this one in the same column. This is used to create vertical
   * linkage between rows, which is essential for calculating borders
   */
  up?: TableNode;
  down?: TableNode;
  // For nodes that contain nested structures (like objects or arrays), this holds the first cell of each child row.
  heads: TableNode[];
  // A list of CSS class names to be applied to the rendered `div` element.
  classNames: string[];
  // A unique identifier for the node, linking it back to the original JSON data.
  id?: string;
  // The nesting level of the node in the table view, which is different from its level in the JSON tree.
  level: number;
  // Indicates whether the node is a boundary node of its parent node
  borderFlags: Record<BorderFlag, boolean>;
  // The x-coordinate of the top-left corner of this cell in the virtual table, in pixels.
  x: number;
  // The y-coordinate of the top-left corner of this cell in the virtual table, in pixels.
  y: number;

  constructor(type: TableNodeType) {
    this.type = type;
    this.id = "";
    this.row = 0;
    this.span = isTableType(type) ? 0 : 1; // dummyTable span is calculated later
    this.width = 0;
    this.text = "";
    this.level = 0;
    this.x = 0;
    this.y = 0;
    this.borderFlags = {
      left: false,
      right: false,
      top: false,
      bottom: false,
    };
    this.classNames = [];
    this.heads = [];
  }

  clone(fields?: Partial<TableNode>) {
    const nd = new TableNode(this.type);
    Object.assign(nd, this);
    nd.borderFlags = { ...this.borderFlags };
    nd.classNames = [...this.classNames];
    Object.assign(nd, fields);
    return nd;
  }

  // Sets the text content of the node and calculates its initial width based on the text length.
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

  setBorderFlag(flag: BorderFlag | "") {
    if (!flag) {
      return this;
    }

    this.borderFlags[flag] = true;
    return this;
  }

  setId(id: string) {
    this.id = id;
    return this;
  }

  addClass(className: string) {
    className && this.classNames.push(className);
    return this;
  }

  delClass(className: string) {
    pull(this.classNames, className);
    return this;
  }

  setParent(nd: TableNode) {
    this.parent = nd;
    return this;
  }

  setRight(nd: TableNode) {
    this.right = nd;
    return this;
  }

  setUp(nd: TableNode | undefined) {
    if (nd) {
      this.up = nd;
      nd.down = this;
    }
    return this;
  }

  setHeads(nodes: TableNode[]) {
    this.heads = nodes;
    return this;
  }

  findDown(row: number) {
    let last: TableNode = this;
    for (let nd: TableNode | undefined = this; nd && nd.row <= row; nd = nd.down) {
      last = nd as TableNode;
    }
    return last;
  }

  toCell(): TableCell {
    return {
      type: this.type as CellType,
      row: this.row,
      span: this.span,
      width: this.width,
      text: this.text,
      classNames: this.classNames,
      id: this.id,
      level: this.level,
      borderFlags: this.borderFlags,
      x: this.x,
      y: this.y,
    };
  }
}
