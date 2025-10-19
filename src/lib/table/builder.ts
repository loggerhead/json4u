import { hasChildren, isIterable, type Tree, type Node, getRawValue } from "@/lib/parser";
import { maxBy, sum, union } from "lodash-es";
import { globalStyle } from "./style";
import { TableNodeImpl } from "./tableNode";
import type { TableNode, TableNodeType, TableTree } from "./types";
import { newTableTree, toDummyType } from "./utils";

/**
 * The context object passed during the recursive build process.
 */
interface Context {
  /** The current row index in the virtual table. */
  row: number;
  level: number;
}

/**
 * The main entry point for building a `TableTree` from a JSON `Tree`.
 * @param tree The input JSON tree parsed by `@/lib/parser`.
 * @returns A `TableTree` object representing the virtual table.
 */
export function buildTableTree(tree: Tree) {
  const tableTree = newTableTree();

  if (!tree.valid()) {
    return tableTree;
  }

  const ctx = { row: 0, level: 0 };
  /* The table represented by root needs to meet the following requirements:
   * 1. Cells in the same column should maintain the same width.
   * 2. Cells in the same row should maintain the same span.
   */
  const root = createNode(ctx, tree, tree.root());

  for (let i = 0; i < root.span; i++) {
    populateGrid(tableTree, root, i);
  }

  tableTree.width = root.width;
  tableTree.height = root.span * globalStyle.rowHeight;
  return tableTree;
}

function populateGrid(tableTree: TableTree, node: TableNode, startRow: number) {
  let x = node.x;
  let sumWidth = 0;

  /* After createNode() finishes building the table, the width and span of non-leaf nodes are correct.
   * However, if there are nested objects or arrays, the width and span of child nodes need to be adjusted.
   */
  const correctX = (nd: TableNode) => {
    if (nd.parent && nd.borders.includes("right")) {
      nd.width = nd.parent.x + nd.parent.width - x;
    }
    nd.x = x;
    x += nd.width;
    sumWidth += nd.width;
  };

  for (let currentNode: TableNode | undefined = node; currentNode; currentNode = currentNode.next) {
    if (currentNode.type !== "dummyTable") {
      const nd = currentNode.row === startRow ? currentNode : { ...currentNode, type: toDummyType(currentNode.type) };
      correctX(nd);
      addCell(tableTree, startRow, nd);
      continue;
    }

    currentNode.x = x;
    const head = findHead(currentNode.heads, startRow);

    if (head) {
      head.x = x;
      const sub = populateGrid(tableTree, head, startRow);
      x += sub.sumWidth;
      sumWidth += sub.sumWidth;
      continue;
    }

    for (let current: TableNode | undefined = currentNode.heads[0]; current; current = current.next) {
      const nd = { ...current, type: toDummyType(current.type) };
      correctX(nd);
      addCell(tableTree, startRow, nd);
    }
  }

  return { x, sumWidth };
}

function addCell(tableTree: TableTree, row: number, nd: TableNode) {
  if (!tableTree.grid[row]) {
    tableTree.grid[row] = [];
  }
  const col = tableTree.grid[row].length;
  tableTree.grid[row].push(nd);

  if (!nd.id) {
    return;
  }
  if (!tableTree.posMap) {
    tableTree.posMap = new Map();
  }
  if (!tableTree.posMap.get(nd.id)) {
    tableTree.posMap.set(nd.id, []);
  }

  const posList = tableTree.posMap.get(nd.id)!;
  posList.push({ row, col, type: nd.type });
}

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

/**
 * A factory function that creates a `TableNode` based on the type of the input JSON `Node`.
 * It dispatches to specialized functions for iterable types (arrays, objects) or handles primitives directly.
 * @param ctx The current build context.
 * @param tree The full JSON tree.
 * @param node The JSON `Node` to process.
 * @returns A new `TableNodeImpl` instance.
 */
function createNode(ctx: Context, tree: Tree, node: Node): TableNodeImpl {
  // Handles cases where a key is present in some objects in an array but not others.
  // For example, in `[{"a":1, "b":2}, {"a":1}]`, the second object is missing the key "b".
  if (node === undefined) {
    return newNode(ctx, "value").setText("miss").setClass("text-hl-empty");
  }

  const { id, type } = node;

  // If the node is an object or array, delegate to a specific creation function.
  if (isIterable(node)) {
    if (hasChildren(node)) {
      const genFn = type === "array" ? createArrayNode : createObjectNode;
      const newCtx = tree.isRoot(node) ? ctx : { ...ctx, level: ctx.level + 1 };
      return genFn(newCtx, tree, node).setId(id);
    } else {
      // Handle empty objects or arrays.
      const text = type === "object" ? "{}" : "[]";
      return newNode(ctx, "value", id).setText(text).setClass("text-hl-empty");
    }
  }

  // Handle literal values (string, number, boolean, null).
  if (type === "string") {
    const text = node.value || '""';
    const cls = node.value ? "text-hl-string" : "text-hl-empty";
    return newNode(ctx, "value", id).setText(text).setClass(cls);
  } else {
    return newNode(ctx, "value", id).setText(getRawValue(node)!).setClass(`text-hl-${type}`);
  }
}

/**
 * Creates a `TableNode` for a JSON array. This is one of the most complex parts of the builder,
 * as it needs to handle arrays of primitives, arrays of objects, and mixed (heterogeneous) arrays.
 * It creates a columnar layout for arrays of objects.
 * @param ctx The current build context.
 * @param tree The full JSON tree.
 * @param node The JSON `Node` representing the array.
 * @returns A `TableNodeImpl` representing the array.
 */
function createArrayNode(ctx: Context, tree: Tree, node: Node): TableNodeImpl {
  // An array is considered heterogeneous if it contains both primitive values (leaf nodes) and objects/arrays (non-leaf nodes).
  // The `existsLeafNode` flag is used to track whether at least one primitive value exists.
  // e.g., `[1, {"a": 2}, 3]`
  let existsLeafNode = false;
  // Collect all unique keys from child objects to form the table headers.
  const headers = union(
    ...tree.childrenNodes(node).map((child) => {
      existsLeafNode = existsLeafNode || !hasChildren(child);
      return child.childrenKeys;
    }),
  );

  const rows: TableNodeImpl[][] = [];

  // If there are headers, it means we have an array of objects. Create a header row.
  if (headers.length > 0) {
    let firstRow = headers.map((key) =>
      newNode(ctx, "header")
        .setText(key || '""')
        .setClass(key ? "text-hl-key" : "text-hl-empty")
        .setId(node.id),
    );

    // For heterogeneous arrays, add dummy columns for the index and value of primitive elements.
    if (existsLeafNode) {
      const dummyIdxNode = newNode(ctx, "dummyIndex", node.id);
      const dummyNode = newNode(ctx, "dummyHeader", node.id);
      firstRow = [dummyIdxNode, dummyNode, ...firstRow];
    }

    rows.push(firstRow);
  }

  let deltaSpan = rows.length;

  // Iterate over each child of the array to create the data rows.
  tree.mapChildren(node, (child, idxAsKey) => {
    const newCtx = { ...ctx, row: ctx.row + deltaSpan };
    const rowNodes: TableNodeImpl[] = [];

    if (existsLeafNode) {
      // For heterogeneous arrays, create an index cell and a value cell for primitives.
      const idxNode = newNode(newCtx, "index").setId(child.id).setText(idxAsKey);
      const valNode = hasChildren(child) ? newNode(newCtx, "dummyValue") : createNode(newCtx, tree, child);
      rowNodes.push(idxNode, valNode);
    }

    // Create cells for each header key.
    for (let i = 0; i < headers.length; i++) {
      const key = headers[i];
      const colNode = hasChildren(child)
        ? createNode(newCtx, tree, tree.getChild(child, key)!) // If child is object, get value for key.
        : newNode(newCtx, "dummyValue"); // If child is primitive, add a placeholder.

      rowNodes.push(colNode);
    }

    const maxSpan = maxBy(rowNodes, (nd) => nd.span)!.span;
    deltaSpan += maxSpan;
    rows.push(rowNodes);
  });

  // --- Layout Calculation --- //
  // After creating all row nodes, calculate the final width and span for each cell.
  const rowCnt = rows.length;
  const colCnt = rows[0].length;
  const maxSpanPerRow = new Array(rowCnt).fill(0);
  const maxWidthPerCol = new Array(colCnt).fill(0);

  // First pass: find the max width for each column and max span for each row.
  for (let i = 0; i < rowCnt; i++) {
    for (let j = 0; j < colCnt; j++) {
      const nd = rows[i][j];
      maxSpanPerRow[i] = Math.max(maxSpanPerRow[i], nd.span);
      maxWidthPerCol[j] = Math.max(maxWidthPerCol[j], nd.width);
    }
  }

  const heads: TableNodeImpl[] = [];
  const parent = newNode(ctx, "dummyTable");

  // Second pass: apply the calculated widths and spans, and link nodes together.
  for (let i = 0; i < rowCnt; i++) {
    const rowNodes = rows[i];
    const head = rowNodes[0];
    const isLast = i === rowCnt - 1;
    let nd = head
      .setWidth(maxWidthPerCol[0])
      .setSpan(maxSpanPerRow[i])
      .setParent(parent)
      .addBorder(colCnt === 1 ? "right" : "")
      .addBorder(isLast ? "bottom" : "");

    for (let j = 1; j < colCnt; j++) {
      nd.setNext(rowNodes[j]);
      nd = rowNodes[j]
        .setWidth(maxWidthPerCol[j])
        .setSpan(maxSpanPerRow[i])
        .setParent(parent)
        .addBorder(j === colCnt - 1 ? "right" : "")
        .addBorder(isLast ? "bottom" : "");
    }

    heads.push(head);
  }

  // Return a dummy parent node that groups all the rows of the array.
  return parent.setHeads(heads).setWidth(sum(maxWidthPerCol)).setSpan(sum(maxSpanPerRow));
}

/**
 * Creates a `TableNode` for a JSON object. This function arranges the key-value pairs
 * into a two-column layout. The first column contains the keys, and the second column
 * contains the values. If a value is a nested object or array, it is represented by a
 * `dummy` node that will be recursively processed.
 * @param ctx The current build context.
 * @param tree The full JSON tree.
 * @param node The JSON `Node` representing the object.
 * @returns A `TableNodeImpl` representing the object.
 */
function createObjectNode(ctx: Context, tree: Tree, node: Node): TableNodeImpl {
  let maxKeyWidth = 0;
  let maxValWidth = 0;
  let span = 0;
  let maxSpan = 0;

  const childCnt = node.childrenKeys?.length || 0;
  // Generate a key and a value node for each child property.
  const kvNodes = tree.mapChildren(node, (child, key, idx) => {
    const newCtx = { ...ctx, row: ctx.row + span };
    const isLast = idx === childCnt - 1;
    const keyNode = newNode(newCtx, "key")
      .setText(key || '""')
      .setClass(key ? "text-hl-key" : "text-hl-empty")
      .setId(child.id)
      .addBorder(isLast ? "bottom" : "");
    const valNode = createNode(newCtx, tree, child)
      .addBorder("right")
      .addBorder(isLast ? "bottom" : "");

    span += valNode.span;
    maxSpan = Math.max(maxSpan, valNode.span);
    maxKeyWidth = Math.max(maxKeyWidth, keyNode.width);
    maxValWidth = Math.max(maxValWidth, valNode.width);
    return { keyNode, valNode };
  });

  const parent = newNode(ctx, "dummyTable");
  const heads = kvNodes.map(({ keyNode, valNode }) => {
    valNode.setWidth(maxValWidth).setParent(parent);
    keyNode.setNext(valNode).setSpan(valNode.span).setWidth(maxKeyWidth).setParent(parent);
    return keyNode;
  });

  return parent
    .setWidth(maxKeyWidth + maxValWidth)
    .setSpan(span)
    .setHeads(heads);
}

function newNode(ctx: Context, type: TableNodeType, id?: string) {
  return new TableNodeImpl(type)
    .setRow(ctx.row)
    .setLevel(ctx.level)
    .setId(id || "");
}
