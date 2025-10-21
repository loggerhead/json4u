import { hasChildren, isIterable, type Tree, type Node, getRawValue } from "@/lib/parser";
import { maxBy, sum, union } from "lodash-es";
import { TableNode } from "./tableNode";
import type { TableNodeType } from "./types";

// The context object passed during the recursive build process.
export interface CreateContext {
  /** The current row index in the virtual table. */
  row: number;
  level: number;
}

/**
 * A factory function that creates a `TableNode` based on the type of the input JSON `Node`.
 * It dispatches to specialized functions for iterable types (arrays, objects) or handles primitives directly.
 * @param ctx The current build context.
 * @param tree The full JSON tree.
 * @param node The JSON `Node` to process.
 */
export function createNode(ctx: CreateContext, tree: Tree, node: Node): TableNode {
  // Handles cases where a key is present in some objects in an array but not others.
  // For example, in `[{"a":1, "b":2}, {"a":1}]`, the second object is missing the key "b".
  if (node === undefined) {
    return newNode(ctx, "value").setText("miss").addClass("text-hl-empty");
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
      return newNode(ctx, "value", id).setText(text).addClass("text-hl-empty");
    }
  }

  // Handle literal values (string, number, boolean, null).
  if (type === "string") {
    const text = node.value || '""';
    const cls = node.value ? "text-hl-string" : "text-hl-empty";
    return newNode(ctx, "value", id).setText(text).addClass(cls);
  } else {
    return newNode(ctx, "value", id).setText(getRawValue(node)!).addClass(`text-hl-${type}`);
  }
}

/**
 * Creates a `TableNode` for a JSON array. This is one of the most complex parts of the builder,
 * as it needs to handle arrays of primitives, arrays of objects, and mixed (heterogeneous) arrays.
 * It creates a columnar layout for arrays of objects.
 * @param ctx The current build context.
 * @param tree The full JSON tree.
 * @param node The JSON `Node` representing the array.
 */
function createArrayNode(ctx: CreateContext, tree: Tree, node: Node): TableNode {
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

  const rows: TableNode[][] = [];

  // If there are headers, it means we have an array of objects. Create a header row.
  if (headers.length > 0) {
    let firstRow = headers.map((key) =>
      newNode(ctx, "header")
        .setText(key || '""')
        .addClass(key ? "text-hl-key" : "text-hl-empty")
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
    const rowNodes: TableNode[] = [];

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

  const heads: TableNode[] = [];
  const parent = newNode(ctx, "topHeaderTable");

  // Second pass: apply the calculated widths and spans, and link nodes together.
  for (let i = 0; i < rowCnt; i++) {
    const rowNodes = rows[i];
    const head = rowNodes[0];
    const isFirst = i === 0;
    const isLast = i === rowCnt - 1;

    let nd = head
      .setWidth(maxWidthPerCol[0])
      .setSpan(maxSpanPerRow[i])
      .setParent(parent)
      .setUp(rows?.[i - 1]?.[0])
      .setBorderFlag("left")
      .setBorderFlag(colCnt === 1 ? "right" : "")
      .setBorderFlag(isFirst ? "top" : "")
      .setBorderFlag(isLast ? "bottom" : "");

    for (let j = 1; j < colCnt; j++) {
      nd.setRight(rowNodes[j]);
      nd = rowNodes[j]
        .setWidth(maxWidthPerCol[j])
        .setSpan(maxSpanPerRow[i])
        .setParent(parent)
        .setUp(rows?.[i - 1]?.[j])
        .setBorderFlag(j === colCnt - 1 ? "right" : "")
        .setBorderFlag(isFirst ? "top" : "")
        .setBorderFlag(isLast ? "bottom" : "");
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
 */
function createObjectNode(ctx: CreateContext, tree: Tree, node: Node): TableNode {
  let maxKeyWidth = 0;
  let maxValWidth = 0;
  let span = 0;
  let maxSpan = 0;

  const childCnt = node.childrenKeys?.length || 0;
  // Generate a key and a value node for each child property.
  const kvNodes = tree.mapChildren(node, (child, key, idx) => {
    const newCtx = { ...ctx, row: ctx.row + span };
    const isFirst = idx === 0;
    const isLast = idx === childCnt - 1;

    const keyNode = newNode(newCtx, "key")
      .setText(key || '""')
      .addClass(key ? "text-hl-key" : "text-hl-empty")
      .setId(child.id)
      .setBorderFlag("left")
      .setBorderFlag(isFirst ? "top" : "")
      .setBorderFlag(isLast ? "bottom" : "");
    const valNode = createNode(newCtx, tree, child)
      .setBorderFlag("right")
      .setBorderFlag(isFirst ? "top" : "")
      .setBorderFlag(isLast ? "bottom" : "");

    span += valNode.span;
    maxSpan = Math.max(maxSpan, valNode.span);
    maxKeyWidth = Math.max(maxKeyWidth, keyNode.width);
    maxValWidth = Math.max(maxValWidth, valNode.width);
    return { keyNode, valNode };
  });

  const parent = newNode(ctx, "leftHeaderTable");
  const heads = kvNodes.map(({ keyNode, valNode }, i) => {
    valNode
      .setWidth(maxValWidth)
      .setParent(parent)
      .setUp(kvNodes?.[i - 1]?.valNode);
    keyNode
      .setRight(valNode)
      .setSpan(valNode.span)
      .setWidth(maxKeyWidth)
      .setParent(parent)
      .setUp(kvNodes?.[i - 1]?.keyNode);
    return keyNode;
  });

  return parent
    .setWidth(maxKeyWidth + maxValWidth)
    .setSpan(span)
    .setHeads(heads);
}

function newNode(ctx: CreateContext, type: TableNodeType, id?: string) {
  return new TableNode(type)
    .setRow(ctx.row)
    .setLevel(ctx.level)
    .setId(id || "");
}
