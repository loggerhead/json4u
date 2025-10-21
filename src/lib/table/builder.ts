import { type Tree } from "@/lib/parser";
import { createNode } from "./createNode";
import { globalStyle } from "./style";
import { TableNode } from "./tableNode";
import type { TableGrid } from "./types";
import { isDummyType, isTableType, newTableGrid, toDummyType } from "./utils";

/**
 * The main entry point for building a `tableGrid` from a JSON `Tree`.
 * @param tree The input JSON tree parsed by `@/lib/parser`.
 * @returns A `tableGrid` object representing the virtual table.
 */
export function buildTableGrid(tree: Tree) {
  const tableGrid = newTableGrid();

  if (!tree.valid()) {
    return tableGrid;
  }

  /* The table represented by root needs to meet the following requirements:
   * 1. Cells in the same column should maintain the same width.
   * 2. Cells in the same row should maintain the same span.
   */
  const root = createNode({ row: 0, level: 0 }, tree, tree.root());

  for (let i = 0; i < root.span; i++) {
    fillGrid(tableGrid, root, i);
  }

  tableGrid.width = root.width;
  tableGrid.height = root.span * globalStyle.rowHeight;
  return tableGrid;
}

/**
 * Fills the `grid` and `posMap` of a `tableGrid` by traversing a given `TableNode` row.
 *
 * This function iterates through a linked list of `TableNode`s, which represents a single row in the
 * conceptual table. For each node in the row, it calculates the final `x` position and width, then
 * adds the node to the `grid`. It also handles the recursive population of nested tables (`leftHeaderTable` or `topHeaderTable` nodes).
 *
 * @param ctx The current fill context.
 * @param tableGrid The `tableGrid` to populate.
 * @param node The starting `TableNode` of the row to process.
 * @param startRow The absolute row index in the final grid where this row should be placed.
 * @returns An object containing the final `x` coordinate and the total `sumWidth` of the processed row.
 */
function fillGrid(tableGrid: TableGrid, node: TableNode, startRow: number) {
  let x = node.x;
  let sumWidth = 0;

  // The parent node may be wider than the sum of its child nodes,
  // so the width difference needs to be allocated to the rightmost child node.
  const adjustWidth = (nd: TableNode) => {
    if (nd.parent && nd.borderFlags["right"]) {
      nd.width = nd.parent.x + nd.parent.width - x;
    }
    nd.x = x;
  };

  const accWidth = (w: number) => {
    x += w;
    sumWidth += w;
  };

  for (let current: TableNode | undefined = node; current; current = current.right) {
    if (isTableType(current.type)) {
      adjustWidth(current);
      const head = findHead(current.heads, startRow);

      if (head) {
        head.x = x;
        const sub = fillGrid(tableGrid, head, startRow);
        accWidth(sub.sumWidth);
      }
    } else {
      const nd = current.row === startRow ? current : newDummyNode(current, startRow);
      adjustWidth(nd);
      accWidth(nd.width);
      addCell(tableGrid, nd, startRow);
    }
  }

  return { x, sumWidth };
}

/**
 * A helper function to add a cell to the grid and update the position map.
 * @param row The absolute row index in the grid.
 * @param nd The `TableNode` cell to add.
 */
function addCell(tableGrid: TableGrid, nd: TableNode, row: number) {
  if (!tableGrid.grid[row]) {
    tableGrid.grid[row] = [];
  }
  const col = tableGrid.grid[row].length;

  addBorder(nd);
  const cell = nd.toCell();
  tableGrid.grid[row].push(cell);

  // Add the cell position to the map.
  if (!nd.id) {
    return;
  }
  if (!tableGrid.posMap) {
    tableGrid.posMap = new Map();
  }
  if (!tableGrid.posMap.get(nd.id)) {
    tableGrid.posMap.set(nd.id, []);
  }

  const posList = tableGrid.posMap.get(nd.id)!;
  posList.push({ row, col, type: cell.type });
}

function addBorder(nd: TableNode) {
  nd.addClass("border-b").addClass("border-r");

  if (isDummyType(nd.type) && nd.up?.classNames.includes("border-b")) {
    nd.up.delClass("border-b");
  }
}

function newDummyNode(nd: TableNode, row: number) {
  nd = nd.findDown(row);
  const dummy = nd.clone({
    type: toDummyType(nd.type),
    row: row,
    span: 1,
    text: undefined,
    classNames: [],
    heads: [],
    up: undefined,
    down: undefined,
    right: undefined,
  });
  dummy.setUp(nd);
  return dummy;
}

function findHead(heads: TableNode[], row: number): TableNode | undefined {
  let left = 0;
  let right = heads.length - 1;
  let res: TableNode | undefined;

  while (left <= right) {
    const mid = Math.floor((left + right) / 2);
    const node = heads[mid]!;

    // Check if the target row falls within the span of the current node.
    if (node.row <= row && row < node.row + node.span) {
      return node;
    }

    if (node.row <= row) {
      // 当前节点行号 <= row，可能是候选结果，继续向右查找更大的符合条件节点
      res = node;
      left = mid + 1;
    } else {
      right = mid - 1;
    }
  }

  return res || heads[0];
}
