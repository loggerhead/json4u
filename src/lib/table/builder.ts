import { genTableId } from "@/lib/idgen";
import { hasChildren, getChildCount, isIterable, type Tree, type Node, getRawValue } from "@/lib/parser";
import { max, maxBy, sum, union } from "lodash-es";
import { globalStyle } from "./style";
import { newTableTree, TableNodeImpl } from "./tableNode";

interface Context {
  row: number;
}

export function buildTableTree(tree: Tree) {
  const tableTree = newTableTree();

  if (!tree.valid()) {
    return tableTree;
  }

  const ctx = { row: 0 };
  const root = createNode(ctx, tree, tree.root());
  tableTree.root = root;
  tableTree.width = root.width;
  tableTree.height = root.span * globalStyle.rowHeight;
  // TODO:
  return tableTree;
}

function createNode(ctx: Context, tree: Tree, node: Node): TableNodeImpl {
  // if node is the miss value corresponding to the key in the object in the array. For example:
  //
  //   [{"a":1, "b":2}, {"a":1}]
  //
  // "b" is miss value for the second object in the array, so it's value node is "miss".
  if (node === undefined) {
    return new TableNodeImpl("value", ctx.row).setText("miss").setClass("text-hl-empty");
  }

  const id = genTableId(node.id);

  // if node is object or array
  if (isIterable(node)) {
    if (hasChildren(node)) {
      const genFn = node.type === "array" ? createArrayNode : createObjectNode;
      return genFn(ctx, tree, node).setId(id);
    } else {
      const text = node.type === "object" ? "{}" : "[]";
      return new TableNodeImpl("value", ctx.row).setText(text).setClass("text-hl-empty").setId(id);
    }
  }

  // if node is literal value
  if (node.type === "string") {
    const text = node.value || '""';
    const cls = node.value ? "text-hl-string" : "text-hl-empty";
    return new TableNodeImpl("value", ctx.row).setText(text).setClass(cls).setId(id);
  } else {
    return new TableNodeImpl("value", ctx.row).setText(getRawValue(node)!).setClass(`text-hl-${node.type}`).setId(id);
  }
}

function createArrayNode(ctx: Context, tree: Tree, node: Node): TableNodeImpl {
  // TODO: 加注释
  /* 如果同时存在叶子节点和 headers，那么 array node 是异型结构。比如：
   * |   |   | header1 | header2 |
   * | 0 | leaf1 |  | |
   * | 1 | leaf2 |  | |
   */
  let existsLeafNode = false;
  const headers = union(
    ...tree.childrenNodes(node).map((child) => {
      existsLeafNode = existsLeafNode || !hasChildren(child);
      return child.childrenKeys;
    }),
  );

  let deltaSpan = 0;
  const rows: TableNodeImpl[][] = [];

  if (headers.length > 0) {
    deltaSpan = 1;
    const headerRow = headers.map((key: string) => createHeaderNode(ctx, key).setClass("sticky-scroll"));

    if (existsLeafNode) {
      const dummyIdxNode = new TableNodeImpl("dummyHeader", ctx.row);
      const dummyValNode = new TableNodeImpl("dummyHeader", ctx.row);
      rows.push([dummyIdxNode, dummyValNode, ...headerRow]);
    } else {
      rows.push(headerRow);
    }
  }

  tree.mapChildren(node, (child, idxAsKey) => {
    const newCtx = { ...ctx, row: ctx.row + deltaSpan };
    const rowNodes: TableNodeImpl[] = [];

    if (existsLeafNode) {
      // if the child is a leaf node, then we show the value in index cell for distinction.
      const idxNode = new TableNodeImpl("arrayIndex", newCtx.row).setText(idxAsKey);
      const valNode = hasChildren(child)
        ? new TableNodeImpl("dummyValue", newCtx.row)
        : createNode(newCtx, tree, child);
      rowNodes.push(idxNode, valNode);
    }

    for (const key of headers) {
      const colNode = hasChildren(child)
        ? createNode(newCtx, tree, tree.getChild(child, key)!)
        : new TableNodeImpl("dummyValue", newCtx.row);
      rowNodes.push(colNode);
    }

    const maxSpan = maxBy(rowNodes, (nd) => nd.span)!.span;
    deltaSpan += maxSpan;
    rows.push(rowNodes);
  });

  const rowCnt = rows.length;
  const colCnt = rows[0].length;
  const maxSpanPerRow = new Array(rowCnt).fill(0);
  const maxWidthPerCol = new Array(colCnt).fill(0);

  for (let i = 0; i < rowCnt; i++) {
    const row = rows[i];
    for (let j = 0; j < colCnt; j++) {
      const nd = row[j];
      maxSpanPerRow[i] = Math.max(maxSpanPerRow[i], nd.span);
      maxWidthPerCol[j] = Math.max(maxWidthPerCol[j], nd.width);
    }
  }

  const heads: TableNodeImpl[] = [];

  for (let i = 0; i < rowCnt; i++) {
    const row = rows[i];
    const head = row[0];
    let nd = head.setWidth(maxWidthPerCol[0]).setSpan(maxSpanPerRow[i]);

    for (let j = 1; j < colCnt; j++) {
      nd.setNext(row[j]);
      nd = row[j].setWidth(maxWidthPerCol[j]).setSpan(maxSpanPerRow[i]);
    }

    heads.push(head);
  }

  return new TableNodeImpl("dummyParent", ctx.row)
    .setHeads(heads)
    .setWidth(sum(maxWidthPerCol))
    .setSpan(sum(maxSpanPerRow));
}

function createObjectNode(ctx: Context, tree: Tree, node: Node): TableNodeImpl {
  let maxKeyWidth = 0;
  let maxValWidth = 0;
  let span = 0;

  // generate key:value pair as the row
  const kvNodes = tree
    .mapChildren(node, (child, key) => {
      const newCtx = { ...ctx, row: ctx.row + span };
      const cnt = getChildCount(child);
      const cntText = cnt ? (child.type === "array" ? `[${cnt}]` : `{${cnt}}`) : undefined;

      const keyNode = createHeaderNode(newCtx, key, cntText);
      const valNode = createNode(newCtx, tree, child);

      span += valNode.span;
      maxKeyWidth = Math.max(maxKeyWidth, keyNode.width);
      maxValWidth = Math.max(maxValWidth, valNode.width);
      return { keyNode, valNode };
    })
    .map(({ keyNode, valNode }) => {
      keyNode.setSpan(valNode.span);
      keyNode.setWidth(maxKeyWidth);
      valNode.setWidth(maxValWidth);
      return keyNode.setNext(valNode);
    });

  const parentNode = new TableNodeImpl("dummyParent", ctx.row);
  return parentNode
    .setWidth(maxKeyWidth + maxValWidth)
    .setSpan(span)
    .setHeads(kvNodes);
}

function createHeaderNode(ctx: Context, key: string, cntText?: string): TableNodeImpl {
  const headerNode = new TableNodeImpl("header", ctx.row)
    .setText(key || '""')
    .setClass(key ? "text-hl-key" : "text-hl-empty");

  if (cntText) {
    // TODO:
    // headerNode.innerChild(h("span", cntText).class("text-hl-empty"));
    return headerNode;
  } else {
    return headerNode;
  }
}
