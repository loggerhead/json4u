import { genExpanderId, genTableId, toPath, toPointer } from "@/lib/idgen";
import { hasChildren, getChildCount, isIterable, type Tree, type Node, NodeType, getRawValue } from "@/lib/parser";
import { reduce, union } from "lodash-es";
import { h, H } from "./tag";

export function genDomString(tree: Tree) {
  return tree.valid() ? genDom(tree, tree.root()).toString() : "";
}

function genDom(tree: Tree, node: Node, addExpander?: boolean): H {
  // if node is the miss value corresponding to the key in the object in the array. For example:
  //
  //   [{"a":1, "b":2}, {"a":1}]
  //
  // "b" is miss value for the second object in the array, so it's value node is "miss".
  if (node === undefined) {
    return h("span", "miss").class("tbl-val", "text-hl-empty");
  }

  const id = genTableId(node.id);

  // if node is object or array
  if (isIterable(node)) {
    if (hasChildren(node)) {
      const el = h();
      addExpander && el.child(genExpander(genExpanderId(id)));
      return el.child((node.type === "array" ? genArrayDom : genObjectDom)(tree, node).id(id));
    } else {
      return h("span", node.type === "object" ? "{}" : "[]")
        .class("tbl-val", "text-hl-empty")
        .id(id);
    }
  }

  // if node is literal value
  if (node.type === "string") {
    return h("span", node.value || '""')
      .class("tbl-val", node.value ? "text-hl-string" : "text-hl-empty")
      .id(id);
  } else {
    return h("span", getRawValue(node)!).class("tbl-val", `text-hl-${node.type}`).id(id);
  }
}

function genArrayDom(tree: Tree, node: Node) {
  let existsLeafNode = false;
  const headers = union(
    ...tree.childrenNodes(node).map((child) => {
      if (!hasChildren(child)) {
        existsLeafNode = true;
      }
      return child.childrenKeys;
    }),
  );

  // if the child nodes are heterogeneous (object and array nodes are treated as isomorphic.)
  // then we need to show index to imply the presence of heterogeneous nodes to the user.
  const indexHeader = existsLeafNode ? h("th") : "";
  const key2ExpanderId = genArrayExpanderIds(tree, node);
  const rowForHeaders = headers.length
    ? h("tr", indexHeader)
        .addChildren(headers.map((key) => genTableHeader(tree, node, key, key2ExpanderId[key])))
        .class("sticky-scroll")
    : "";

  const rows = tree.mapChildren(node, (child, i) => {
    const indexCell = existsLeafNode ? h("td", h("span", i).class("tbl-no")).class("tbl-index") : "";
    let valueCells: H[] = [];

    if (hasChildren(child)) {
      // generate each column for the row
      valueCells = headers.map((key) => h("td", genDom(tree, tree.getChild(child, key)!, !!key2ExpanderId[key])));
    } else {
      // if the child is a leaf node, then we show the value in index cell for distinction.
      (indexCell as H).child(genDom(tree, child).class("tbl-leaf"));
    }

    return h("tr", indexCell).addChildren(valueCells);
  });

  return h("table", h("tbody", rowForHeaders).addChildren(rows)).class("tbl");
}

function genObjectDom(tree: Tree, node: Node) {
  const key2ExpanderId = genObjectExpanderIds(tree, node);

  return h(
    "table",
    h("tbody").addChildren(
      // generate key:value pair as the row
      tree.mapChildren(node, (child, key) => {
        const cnt = getChildCount(child);
        const childCntText = hasChildren(child) ? (child.type === "array" ? `[${cnt}]` : `{${cnt}}`) : undefined;

        return h(
          "tr",
          genTableHeader(tree, node, key, key2ExpanderId[key], childCntText),
          h("td", genDom(tree, child)),
        );
      }),
    ),
  ).class("tbl");
}

const nodeTypeToPrefixMap: Partial<Record<NodeType, string>> = {
  object: "{}",
  array: "[]",
};

function genTableHeader(tree: Tree, node: Node, key: string, expanderId?: string, cntText?: string) {
  const path = genKeyAndTypeList(tree, node.id, key);
  const title = path
    .map(({ nodeType, key }, i) => {
      // last key in the path has no prefix
      const prefix = i < path.length - 1 ? nodeTypeToPrefixMap[nodeType!] + " " : "";
      return `${prefix}${key.replaceAll('"', "&quot;")}`;
    })
    .join("\n");

  const keyDom = h(
    "span",
    h("span", key || '""').class(key ? "text-hl-key" : "text-hl-empty"),
    cntText ? h("span", cntText).class("text-hl-empty") : "",
  );

  return h("th", h("div", keyDom, genExpander(expanderId)).class("tbl-key")).title(title);
}

function genExpander(expanderId?: string) {
  if (!expanderId) {
    return "";
  }
  return h("div").id(expanderId).class("tbl-expander", "codicon", "codicon-folding-expanded");
}

function genArrayExpanderIds(tree: Tree, arrayNode: Node) {
  const key2ExpanderId: Record<string, string> = {};

  tree.mapChildren(arrayNode, (child) => {
    tree.mapChildren(child, (grandson, key) => {
      if (hasChildren(grandson) && !key2ExpanderId[key]) {
        key2ExpanderId[key] = genExpanderId(arrayNode.id, key);
      }
    });
  });

  return key2ExpanderId;
}

function genObjectExpanderIds(tree: Tree, objectNode: Node) {
  const key2ExpanderId: Record<string, string> = {};

  tree.mapChildren(objectNode, (child, key) => {
    if (hasChildren(child)) {
      key2ExpanderId[key] = genExpanderId(child.id);
    }
  });

  return key2ExpanderId;
}

export interface KeyWithType {
  key: string;
  nodeType?: NodeType;
}

export function genKeyAndTypeList(tree: Tree, id: string, ...keys: string[]): KeyWithType[] {
  const path = toPath(id);

  // if root node is a literal value node
  if (path.length === 0 || path[0] === "") {
    return keys.map((key) => ({ key }));
  }

  path.push(...keys);

  return reduce(
    path,
    (acc, key) => {
      const id = toPointer(acc.map(({ key }) => key));
      acc.push({ nodeType: tree.node(id).type, key });
      return acc;
    },
    [] as ReturnType<typeof genKeyAndTypeList>,
  );
}
