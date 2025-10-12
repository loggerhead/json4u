import type { TableNodeStyle, TableNodeType } from "./types";

// should be con with InitialSetup()
export const cellClassMap: Record<TableNodeType, string> = {
  header: "tbl-header",
  value: "tbl-value",
  arrayIndex: "tbl-index",
  dummyHeader: "tbl-header",
  dummyValue: "tbl-value",
  dummyParent: "tbl-header",
};

// measured in MainPanel when mounted. The value should remain consistent between the main thread and the web worker.
export const globalStyle: TableNodeStyle = {
  fontWidth: 8.9,
  rowHeight: 32,
  maxCellWidth: 500,
  padding: 12,
};

export function setupGlobalTableStyle(style: Partial<TableNodeStyle>) {
  Object.assign(globalStyle, style);
}
