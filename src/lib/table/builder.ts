import { hasChildren, getChildCount, isIterable, type Tree, type Node, getRawValue } from "@/lib/parser";
import { maxBy, sum, union } from "lodash-es";
import { globalStyle } from "./style";
import { TableNodeImpl } from "./tableNode";
import type { TableNode, TableNodeType } from "./types";
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
  const root = createNode(ctx, tree, tree.root());
  correctWidth(root);
  correctXY(root);

  const grid = Array.from({ length: root.span }, (_, i) => getRow(root, i));

  // Populate the idToPos map.
  for (let row = 0; row < grid.length; row++) {
    for (let col = 0; col < grid[row].length; col++) {
      const nd = grid[row][col];

      if (!nd.id) {
        continue;
      }

      if (!tableTree.posMap?.get(nd.id)) {
        tableTree.posMap?.set(nd.id, []);
      }

      tableTree.posMap?.get(nd.id)?.push({ row, col, type: nd.type });
    }
  }

  tableTree.grid = grid;
  tableTree.width = root.width;
  tableTree.height = root.span * globalStyle.rowHeight;
  return tableTree;
}

/**
 * Traverses the linked-list and tree structure of `TableNode`s to collect all cells for a specific row index.
 * @param node The starting `TableNode` (usually the root or a sub-tree root).
 * @param row The row index to retrieve.
 * @returns An array of `TableNode`s that constitute the specified row.
 */
function getRow(node: TableNode, row: number): TableNode[] {
  const res: TableNode[] = [];
  const stack = [node];

  while (stack.length > 0) {
    const nd = stack.pop()!;
    // Traverse horizontally to the next cell in the current row.
    nd.next && stack.push(nd.next);

    if (nd.type === "dummyParent") {
      // If it's a parent, find the correct child head for the target row and traverse it.
      const head = findHead(nd.heads, row)!;
      head && stack.push(head);
      continue;
    }

    // This is a regular cell, add it to the result.
    if (nd.row === row) {
      const borders = nd.borders.filter((b) => !(row === 0 && b === "top") && !(nd.span > 1 && b === "bottom"));
      res.push({ ...nd, borders });
      continue;
    }

    const isLast = row === nd.row + nd.span - 1 && nd.borders.includes("bottom");
    const borders = nd.borders.filter((b) => (b !== "bottom" && b !== "top") || (isLast && b === "bottom"));
    res.push({ ...nd, borders, type: toDummyType(nd.type) });
  }

  return res;
}

/**
 * Performs a binary search on the `heads` of a parent node to find the child
 * `TableNode` that corresponds to a specific row index.
 * @param heads An array of child head nodes.
 * @param row The target row index.
 * @returns The `TableNode` for the specified row, or `undefined` if not found.
 */
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

function correctXY(root: TableNodeImpl) {
  const queue: TableNodeImpl[] = [root];
  root.x = 0;

  while (queue.length > 0) {
    const node = queue.shift()!;

    // The x of the next node is the current node's x + its width.
    if (node.next) {
      const nextNode = node.next as TableNodeImpl;
      nextNode.x = node.x + node.width;
      queue.push(nextNode);
    }

    // If it's a dummy parent, the x of each head is the parent's x.
    if (node.type === "dummyParent") {
      for (const head of node.heads) {
        const headNode = head as TableNodeImpl;
        headNode.x = node.x;
        queue.push(headNode);
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
  const kvNodes = tree.mapChildren(node, (child, key) => {
    const newCtx = { ...ctx, row: ctx.row + span };
    const cnt = getChildCount(child);
    const cntText = cnt ? (child.type === "array" ? `[${cnt}]` : `{${cnt}}`) : undefined;

    const keyNode = newNode(newCtx, "key")
      .setText(key || '""')
      .setClass(key ? "text-hl-key" : "text-hl-empty")
      .setId(child.id);
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

  return newNode(ctx, "dummyParent")
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
