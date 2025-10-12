export interface TableTree {
  root: TableNode;
  width: number;
  height: number;
}

// Represents the type of a node in the table view.
export type TableNodeType =
  | "header" // objectKey or arrayIndex
  | "arrayIndex"
  | "value"
  | "dummyHeader"
  | "dummyValue"
  | "dummyParent";

// Represents a node in the table view, providing the necessary data for rendering.
export interface TableNode {
  // The type of the node, which determines how it is rendered in the table.
  type: TableNodeType;
  row: number;
  span: number;
  width: number;
  text: string;
  next?: TableNode;
  heads: TableNode[];
  classNames: string[];
  id?: string;
}

export interface TableNodeStyle {
  fontWidth: number;
  rowHeight: number;
  maxCellWidth: number;
  padding: number;
}
