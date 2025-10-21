import type { CellType, TableCellStyle } from "./types";

/**
 * A mapping from `TableNodeType` to the corresponding CSS class name.
 * This allows for styling different types of cells (headers, values, etc.) with specific CSS rules.
 * The class names should correspond to styles defined in `globals.css`.
 */
export const cellClassMap: Record<CellType, string> = {
  key: "tbl-header",
  value: "tbl-value",
  index: "tbl-index",
  header: "tbl-header",
  dummyKey: "tbl-header",
  dummyIndex: "tbl-value",
  dummyHeader: "tbl-header",
  dummyValue: "tbl-value",
};

export const headerBgClassNames = ["bg-stone-300", "bg-gray-200"];

/**
 * Global style properties used for layout calculations. These values are crucial for determining
 * the size of cells and the overall dimensions of the table.
 */
export const globalStyle: TableCellStyle = {
  fontWidth: 9,
  rowHeight: 32,
  maxCellWidth: 500,
  padding: 12,
  scrollbarWidth: 15,
};

/**
 * Updates the global style properties. This is typically called once in `InitialSetup()`
 * at application startup to inject measured values from the DOM, ensuring accurate layout calculations.
 */
export function setupGlobalTableStyle(style: Partial<TableCellStyle>) {
  Object.assign(globalStyle, style);
}
