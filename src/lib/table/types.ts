/**
 * This file defines the data structures for representing a nested JSON object as a virtual table.
 * The core idea is to transform the JSON tree into a 2D array of virtual cells (`TableNode`),
 * which can then be rendered efficiently using `div` elements instead of native `<table>` tags.
 * This approach allows for virtualization, significantly improving performance for large and complex JSON data.
 */

/**
 * Represents the entire virtual table, including its root node and overall dimensions.
 */
export interface TableTree {
  /** The root node of the table structure. */
  root: TableNode;
  /** The total width of the table in pixels. */
  width: number;
  /** The total height of the table in pixels. */
  height: number;
}

/**
 * Defines the type of a `TableNode`, which influences its styling and behavior.
 * This helps distinguish between different parts of the JSON structure, such as keys, values, and indices.
 */
export type TableNodeType =
  | "header" // Represents a header, which is used for object keys or as a column header for arrays of objects.
  | "arrayIndex" // Represents an array index.
  | "value" // Represents a JSON value (string, number, boolean, null).
  | "dummyHeader" // A placeholder for alignment.
  | "dummyValue" // A placeholder for alignment in complex array structures.
  | "dummyParent"; // An internal node used to group children, not rendered directly.

/**
 * Represents a single virtual cell in the table. Instead of a DOM element, it's a data object
 * containing all necessary information for rendering, such as content, size, and position.
 */
export interface TableNode {
  /** The type of the node, determining its role and appearance. */
  type: TableNodeType;
  /** The starting row index of this cell in the virtual grid. */
  row: number;
  /** The number of rows this cell spans (rowSpan). */
  span: number;
  /** The width of this cell in pixels. */
  width: number;
  /** The text content to be displayed in the cell. */
  text: string;
  /** A pointer to the next cell in the same row, forming a linked list of cells. */
  next?: TableNode;
  /** For nodes that contain nested structures (like objects or arrays), this holds the first cell of each child row. */
  heads: TableNode[];
  /** A list of CSS class names to be applied to the rendered `div` element. */
  classNames: string[];
  /** A unique identifier for the node, linking it back to the original JSON data. */
  id?: string;
}

/**
 * Defines the styling and layout properties required for calculating the dimensions of table cells.
 */
export interface TableNodeStyle {
  /** The average width of a single character in the font used. */
  fontWidth: number;
  /** The height of a single row in pixels. */
  rowHeight: number;
  /** The maximum allowed width for a single cell to prevent excessively wide columns. */
  maxCellWidth: number;
  /** The horizontal padding within a cell. */
  padding: number;
}
