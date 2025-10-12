import type { TableNodeStyle, TableNodeType } from "./types";

/**
 * A mapping from `TableNodeType` to the corresponding CSS class name.
 * This allows for styling different types of cells (headers, values, etc.) with specific CSS rules.
 * The class names should correspond to styles defined in `globals.css`.
 */
export const cellClassMap: Record<TableNodeType, string> = {
  header: "tbl-header",
  value: "tbl-value",
  arrayIndex: "tbl-index",
  dummyHeader: "tbl-header",
  dummyValue: "tbl-value",
  dummyParent: "tbl-header", // dummyParent is not rendered, so this is just a fallback.
};

/**
 * Global style properties used for layout calculations. These values are crucial for determining
 * the size of cells and the overall dimensions of the table.
 */
export const globalStyle: TableNodeStyle = {
  /** The average width of a single character. This is a key factor in calculating cell widths. */
  fontWidth: 8.9,
  /** The fixed height for each row in pixels. */
  rowHeight: 32,
  /** The maximum width a cell can have, to prevent overly wide columns. */
  maxCellWidth: 500,
  /** The horizontal padding inside each cell. */
  padding: 12,
};

/**
 * Updates the global style properties. This is typically called once in `InitialSetup()`
 * at application startup to inject measured values from the DOM, ensuring accurate layout calculations.
 */
export function setupGlobalTableStyle(style: Partial<TableNodeStyle>) {
  Object.assign(globalStyle, style);
}
