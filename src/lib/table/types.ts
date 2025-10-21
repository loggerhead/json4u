/**
 * This file defines the data structures for representing a nested JSON object as a virtual table.
 * The core idea is to transform the JSON tree into a 2D array of virtual cells (`TableNode`),
 * which can then be rendered efficiently using `div` elements instead of native `<table>` tags.
 * This approach allows for virtualization, significantly improving performance for large and complex JSON data.
 */

/**
 * Represents the entire virtual table, including its root node and overall dimensions.
 */
export interface TableGrid {
  grid: TableCell[][];
  /** The total width of the table in pixels. */
  width: number;
  /** The total height of the table in pixels. */
  height: number;
  // Maps IDs to positions. NOTICE: Map cannot be transferred via web worker.
  posMap?: Map<string, TableCellPos[]>;
}

export type TableCellPos = {
  row: number;
  col: number;
  type: CellType;
};

export type BorderFlag = "left" | "right" | "top" | "bottom";
/**
 * Defines the type of a `TableNode`, which influences its styling and behavior.
 * This helps distinguish between different parts of the JSON structure, such as keys, values, and indices.
 */
export type TableNodeType =
  | "key" // Represents the key in an object, serving as the left header of the `leftHeaderTable`.
  | "value" // Represents a JSON value (string, number, boolean, null).
  | "index" // Represents an array index.
  | "header" // Represents a column header for arrays of objects, serving as the top header of the `topHeaderTable`.
  | "leftHeaderTable" // An internal node representing an object used to group children, not rendered directly.
  | "topHeaderTable" // An internal node representing an array used to group children, not rendered directly.
  | "dummyKey" // A placeholder for alignment.
  | "dummyValue"
  | "dummyIndex"
  | "dummyHeader";

export type CellType = Exclude<TableNodeType, "leftHeaderTable" | "topHeaderTable">;

export interface TableCell {
  type: CellType;
  row: number;
  span: number;
  x: number;
  y: number;
  width: number;
  level: number;
  id?: string;
  text: string;
  classNames: string[];
  borderFlags: Record<BorderFlag, boolean>;
}

/**
 * Defines the styling and layout properties required for calculating the dimensions of table cells.
 */
export interface TableCellStyle {
  /** The average width of a single character in the font used. */
  fontWidth: number;
  /** The height of a single row in pixels. */
  rowHeight: number;
  /** The maximum allowed width for a single cell to prevent excessively wide columns. */
  maxCellWidth: number;
  /** The horizontal padding within a cell. */
  padding: number;
  scrollbarWidth: number;
}
