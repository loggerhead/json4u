import { genTableId } from "@/lib/idgen";
import { hasChildren, getChildCount, isIterable, type Tree, type Node, getRawValue } from "@/lib/parser";
import { maxBy, sum, union } from "lodash-es";
import { globalStyle } from "./style";
import { getRow, newTableTree, TableNodeImpl } from "./tableNode";
import type { TableNode, TableNodeType } from "./types";

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
  const root = createNode(ctx, tree, tree.root());
  correctWidth(root);
  const grid: TableNode[][] = [];

  for (let i = 0; i < root.span; i++) {
    grid.push(getRow(root, i, root.span));
  }

  tableTree.grid = grid;
  tableTree.width = root.width;
  tableTree.height = root.span * globalStyle.rowHeight;
  return tableTree;
}

// The width of dummyParent might be set larger than keyNode.width + valNode.width in `createObjectNode()`. Therefore, we need to correct the width of valNode using BFS.
// For example: if dummyParent.width is 100 and keyNode.width is 20, then valNode.width should be corrected to 100-20=80.
function correctWidth(root: TableNodeImpl) {
  const queue: TableNodeImpl[] = [root];
  while (queue.length > 0) {
    const node = queue.shift()!;

    // Check if it's a dummyParent for an object, which has a strict 2-column layout.
    const isObjectParent =
      node.type === "dummyParent" && node.heads.length > 0 && node.heads[0].next && !node.heads[0].next.next;

    if (isObjectParent) {
      for (const head of node.heads) {
        const keyNode = head as TableNodeImpl;
        const valNode = keyNode.next as TableNodeImpl | undefined;

        if (valNode) {
          // The parent's width is the total intended width for the row.
          // The keyNode's width is already normalized.
          // The valNode's width should be adjusted to fill the remaining space.
          const correctedValWidth = node.width - keyNode.width;
          valNode.setWidth(correctedValWidth);
        }
      }
    }

    // Add all children to the queue for the next level of traversal.
    for (const head of node.heads) {
      let current: TableNodeImpl | undefined = head as TableNodeImpl;
      while (current) {
        queue.push(current);
        current = current.next as TableNodeImpl | undefined;
      }
    }
  }
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

  const id = genTableId(node.id);

  // If the node is an object or array, delegate to a specific creation function.
  if (isIterable(node)) {
    if (hasChildren(node)) {
      const genFn = node.type === "array" ? createArrayNode : createObjectNode;
      const newCtx = tree.isRoot(node) ? ctx : { ...ctx, level: ctx.level + 1 };
      return genFn(newCtx, tree, node).setId(id);
    } else {
      // Handle empty objects or arrays.
      const text = node.type === "object" ? "{}" : "[]";
      return newNode(ctx, "value").setText(text).setClass("text-hl-empty").setId(id);
    }
  }

  // Handle literal values (string, number, boolean, null).
  if (node.type === "string") {
    const text = node.value || '""';
    const cls = node.value ? "text-hl-string" : "text-hl-empty";
    return newNode(ctx, "value").setText(text).setClass(cls).setId(id);
  } else {
    return newNode(ctx, "value").setText(getRawValue(node)!).setClass(`text-hl-${node.type}`).setId(id);
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
    let firstRow = headers.map((key) => createHeaderNode(ctx, key));

    // For heterogeneous arrays, add dummy columns for the index and value of primitive elements.
    if (existsLeafNode) {
      const dummyIdxNode = newNode(ctx, "dummyHeader");
      const dummyValNode = newNode(ctx, "dummyValue");
      firstRow = [dummyIdxNode, dummyValNode, ...firstRow];
    }

    rows.push(firstRow);
  }

  let deltaSpan = rows.length;

  // Iterate over each child of the array to create the data rows.
  tree.mapChildren(node, (child, idxAsKey, idx) => {
    const newCtx = { ...ctx, row: ctx.row + deltaSpan };
    const rowNodes: TableNodeImpl[] = [];

    if (existsLeafNode) {
      // For heterogeneous arrays, create an index cell and a value cell for primitives.
      const idxNode = newNode(newCtx, "arrayIndex").setText(idxAsKey);
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

      nd.addBorder("right").addBorder(
        nd.type === "dummyParent" || rows?.[i + 1]?.[j]?.type === "dummyParent" || i === rowCnt - 1 ? "bottom" : "",
      );
    }
  }

  const heads: TableNodeImpl[] = [];

  // Second pass: apply the calculated widths and spans, and link nodes together.
  for (let i = 0; i < rowCnt; i++) {
    const rowNodes = rows[i];
    const head = rowNodes[0];
    let nd = head.setWidth(maxWidthPerCol[0]).setSpan(maxSpanPerRow[i]);

    for (let j = 1; j < colCnt; j++) {
      nd.setNext(rowNodes[j]);
      nd = rowNodes[j].setWidth(maxWidthPerCol[j]).setSpan(maxSpanPerRow[i]);
    }

    heads.push(head);
  }

  // Return a dummy parent node that groups all the rows of the array.
  return newNode(ctx, "dummyParent").setHeads(heads).setWidth(sum(maxWidthPerCol)).setSpan(sum(maxSpanPerRow));
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

  // Generate a key and a value node for each child property.
  const kvNodes = tree.mapChildren(node, (child, key, idx) => {
    const newCtx = { ...ctx, row: ctx.row + span };
    const cnt = getChildCount(child);
    const cntText = cnt ? (child.type === "array" ? `[${cnt}]` : `{${cnt}}`) : undefined;

    const keyNode = createHeaderNode(newCtx, key, cntText);
    const valNode = createNode(newCtx, tree, child).addBorder("right");

    span += valNode.span;
    maxSpan = Math.max(maxSpan, valNode.span);
    maxKeyWidth = Math.max(maxKeyWidth, keyNode.width);
    maxValWidth = Math.max(maxValWidth, valNode.width);
    return { keyNode, valNode };
  });

  const childrenCnt = getChildCount(node);
  const addBorder = (nd: TableNodeImpl, idx: number) =>
    nd.addBorder(maxSpan > 1 || idx === childrenCnt - 1 || nd.type === "dummyParent" ? "bottom" : "");

  const heads = kvNodes.map(({ keyNode, valNode }, idx) => {
    // Normalize widths and spans after all children have been processed.
    valNode.setWidth(maxValWidth);
    // Link key and value nodes.
    keyNode.setNext(valNode).setSpan(valNode.span).setWidth(maxKeyWidth);

    addBorder(keyNode, idx);
    addBorder(valNode, idx);

    if (kvNodes?.[idx + 1]?.valNode?.type === "dummyParent") {
      valNode.addBorder("bottom");
    }
    return keyNode;
  });

  const parentNode = newNode(ctx, "dummyParent");
  return parentNode
    .setWidth(maxKeyWidth + maxValWidth)
    .setSpan(span)
    .setHeads(heads);
}

/**
 * Creates a header node, which is used for object keys or as a column header for arrays of objects.
 * @param ctx The current build context.
 * @param key The text of the key.
 * @param cntText Optional text to display, e.g., the number of keys in a object.
 * @returns A `TableNodeImpl` configured as a header.
 */
function createHeaderNode(ctx: Context, key: string, cntText?: string): TableNodeImpl {
  const headerNode = newNode(ctx, "header")
    .setText(key || '""')
    .setClass(key ? "text-hl-key" : "text-hl-empty");

  if (cntText) {
    // TODO: Implement appending child count text to the header node.
    // headerNode.innerChild(h("span", cntText).class("text-hl-empty"));
    return headerNode;
  } else {
    return headerNode;
  }
}

function newNode(ctx: Context, type: TableNodeType) {
  return new TableNodeImpl(type).setRow(ctx.row).setLevel(ctx.level);
}
