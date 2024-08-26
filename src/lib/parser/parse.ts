import { toPointer } from "@/lib/idgen/pointer";
import * as jsonc from "jsonc-parser";
import { last, isEmpty } from "lodash-es";
import {
  type Node,
  type ParseOptions,
  type ContextError,
  type NodeType,
  isIterable,
  computeAndSetBoundLength,
} from "./node";
import { Tree } from "./tree";

export function parseJSON(text: string, options?: ParseOptions, parentMeta?: ParentMeta): Tree {
  const { nodeMap, nestNodeMap, parseErrors } = doParseJSON(text, options, parentMeta);
  const errors = addContextToErrors(text, parseErrors);

  for (const id in nodeMap) {
    nodeMap[id].path = undefined!;
    nodeMap[id].parent = undefined;
    nodeMap[id].childrenOffset = undefined;
  }

  return Tree.fromObject({ nodeMap, text, errors }, nestNodeMap);
}

function doParseJSON(text: string, options?: ParseOptions, parentMeta?: ParentMeta) {
  const visitor = new Visitor(text, options, parentMeta);

  jsonc.visit(
    text,
    {
      onObjectBegin(
        offset: number,
        length: number,
        startLine: number,
        startCharacter: number,
        pathSupplier: () => jsonc.JSONPath,
      ) {
        return visitor.onObjectBegin(offset, "object", pathSupplier);
      },
      onObjectEnd(offset: number, length: number) {
        return visitor.onObjectEnd(offset, length);
      },
      onArrayBegin(
        offset: number,
        length: number,
        startLine: number,
        startCharacter: number,
        pathSupplier: () => jsonc.JSONPath,
      ) {
        return visitor.onObjectBegin(offset, "array", pathSupplier);
      },
      onArrayEnd(offset: number, length: number) {
        return visitor.onObjectEnd(offset, length);
      },
      onObjectProperty(
        property: string,
        offset: number,
        length: number,
        startLine: number,
        startCharacter: number,
        pathSupplier: () => jsonc.JSONPath,
      ) {
        return visitor.onObjectProperty(property, offset);
      },
      onLiteralValue(
        value: any,
        offset: number,
        length: number,
        startLine: number,
        startCharacter: number,
        pathSupplier: () => jsonc.JSONPath,
      ) {
        return visitor.onLiteralValue(value, offset, length, pathSupplier);
      },
      onError(error: jsonc.ParseErrorCode, offset: number, length: number) {
        return visitor.onError(error, offset, length);
      },
    },
    {
      disallowComments: true,
      allowTrailingComma: false,
    },
  );

  const nodeMap = visitor.nodeMap;
  const ids = Object.values(visitor.currentParent.childrenKey2Id ?? {});
  const root = ids.length > 0 ? nodeMap[ids[0]] : undefined;

  return {
    root,
    nodeMap,
    nestNodeMap: visitor.nestNodeMap,
    parseErrors: visitor.parseErrors,
  };
}

// 嵌套解析时，父节点的信息
interface ParentMeta {
  path: jsonc.JSONPath;
}

interface ParseNode extends Node {
  path: jsonc.JSONPath;
  parent?: ParseNode;
  childrenOffset?: Record<string, number>;
}

class Visitor {
  text: string;
  options?: ParseOptions;

  nodeMap: Record<string, ParseNode>;
  // 嵌套解析的节点
  nestNodeMap: Record<string, Node>;
  parseErrors: jsonc.ParseError[];
  currentParent: ParseNode;
  parentMeta: ParentMeta; // 嵌套解析时，父节点信息

  constructor(text: string, options: ParseOptions = {}, parentMeta: ParentMeta = { path: [] }) {
    this.nodeMap = {};
    this.text = text;

    this.options = options;
    this.nestNodeMap = {};
    this.parseErrors = [];
    this.parentMeta = parentMeta;
    this.currentParent = {
      id: "",
      type: "object",
      offset: 0,
      length: 0,
      boundOffset: 0,
      boundLength: 0,
      path: this.parentMeta.path,
      childrenKeys: [],
      childrenKey2Id: {},
      childrenOffset: {},
    };
  }

  genPath(pathSupplier: () => jsonc.JSONPath) {
    return this.parentMeta.path.length ? [...this.parentMeta.path, ...pathSupplier()] : pathSupplier();
  }

  newNode(path: jsonc.JSONPath, type: NodeType, offset: number, length: number = 0) {
    const node: ParseNode = {
      id: toPointer(path),
      type,
      offset,
      length,
      boundOffset: offset,
      boundLength: length,
      path,
      parent: this.currentParent,
    };

    if (isIterable(node)) {
      node.childrenKeys = [];
      node.childrenKey2Id = {};
      node.childrenOffset = {};
    }

    this.nodeMap[node.id] = node;
    return node;
  }

  setValue(node: ParseNode, value: any, offset: number, length: number) {
    node.value = value;
    node.rawValue = this.text.slice(offset, offset + length);
    node.boundOffset = offset;
    node.boundLength = length;
  }

  addChild(child: ParseNode) {
    const key = String(last(child.path));
    const childOffset = this.currentParent.childrenOffset?.[key];

    if (childOffset !== undefined) {
      child.boundOffset = childOffset;
      computeAndSetBoundLength(child);
    }

    this.currentParent.childrenKeys!.push(key);
    this.currentParent.childrenKey2Id![key] = child.id;
  }

  onObjectBegin(offset: number, type: NodeType, pathSupplier: () => jsonc.JSONPath) {
    if (this.parseErrors.length > 0) {
      return false;
    }

    const path = this.genPath(pathSupplier);
    const node = this.newNode(path, type, offset);

    if (this.currentParent) {
      this.addChild(node);
    }

    this.currentParent = node;
    return true;
  }

  onObjectEnd(offset: number, length: number) {
    const parent = this.currentParent;
    if (this.parseErrors.length > 0 || !parent) {
      return;
    }

    parent.length = offset + length - parent.offset;

    if (parent.boundOffset !== undefined) {
      computeAndSetBoundLength(parent);
    }

    if (parent.parent) {
      this.currentParent = parent.parent;
    }
  }

  onObjectProperty(key: string, offset: number) {
    if (this.parseErrors.length > 0) {
      return false;
    }

    this.currentParent.childrenOffset![key] = offset;
  }

  onLiteralValue(value: any, offset: number, length: number, pathSupplier: () => jsonc.JSONPath) {
    if (this.parseErrors.length > 0) {
      return;
    }

    let node: ParseNode | undefined = undefined;
    let errors = undefined;
    const path = this.genPath(pathSupplier);

    if (this.options?.nest && maybeIterable(value)) {
      const { root, nodeMap, parseErrors } = doParseJSON(value, this.options, { path });
      node = root;
      errors = parseErrors;

      if (node && isEmpty(errors)) {
        for (const key in nodeMap) {
          const nd = nodeMap[key];
          this.nodeMap[nd.id] = nd;
        }

        // boundOffset and boundLength will be fixed in stringifyNestNodes or stringify
        node.offset = offset;
        node.length = length;
        this.nestNodeMap[node.id] = node;
      } else {
        node = undefined;
      }
    }

    if (node === undefined) {
      node = this.newNode(path, getNodeType(value), offset, length);
      this.setValue(node, value, offset, length);
    }

    this.addChild(node);
  }

  onError(error: jsonc.ParseErrorCode, offset: number, length: number) {
    this.parseErrors.push({ error, offset, length });
  }
}

function addContextToErrors(text: string, errors: jsonc.ParseError[]): ContextError[] {
  const maxWordLength = 30;

  if (!errors?.length) {
    return [];
  }

  text = text.replace(/\n/g, " ");

  // 找到最近一个单词，如果找不到，则返回最近 5 个字符
  const findUntilFirstWord = (s: string, reverse = false) => {
    if (reverse) {
      s = s.slice(s.length - maxWordLength);
      s = s.split("").reverse().join("");
    } else {
      s = s.slice(0, maxWordLength);
    }

    const mm = s.match(/^.*?\w+/);

    if (mm) {
      s = mm[0];
      return reverse ? s.split("").reverse().join("") : s;
    } else {
      return s.slice(s.length - 5);
    }
  };

  return errors.map((e) => {
    let middle = text.slice(e.offset, e.offset + e.length);

    const leftText = text.slice(0, e.offset);
    let left = findUntilFirstWord(leftText, true);
    left = (left.length < leftText.length ? "..." : "") + left;

    let right = "";

    if (middle.length > maxWordLength) {
      middle = middle.slice(0, maxWordLength);
      right = "...";
    } else {
      const rightText = text.slice(e.offset + e.length);
      right = findUntilFirstWord(rightText);
      right = right + (right.length < rightText.length ? "..." : "");
    }

    return {
      ...e,
      context: [left, middle, right],
    };
  });
}

function getNodeType(value: any): NodeType {
  switch (typeof value) {
    case "boolean":
      return "boolean";
    case "number":
      return "number";
    case "string":
      return "string";
    case "object": {
      if (!value) {
        return "null";
      } else if (Array.isArray(value)) {
        return "array";
      }
      return "object";
    }
    default:
      return "null";
  }
}

function maybeIterable(v: string) {
  return typeof v === "string" && (/^\s*\{.*\}\s*$/.test(v) || /^\s*\[.*\]\s*$/.test(v));
}
