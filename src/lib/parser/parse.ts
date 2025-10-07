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

/**
 * Parses a JSON string and returns a tree.
 * @param text - The JSON string to parse.
 * @param options - The parsing options.
 * @param parentMeta - The parent metadata.
 * @returns The parsed tree.
 */
export function parseJSON(text: string, options?: ParseOptions, parentMeta?: ParentMeta): Tree {
  const { nodeMap, nestNodeMap, parseErrors } = doParseJSON(text, options, parentMeta);
  const errors: ContextError[] =
    parseErrors.map((e) => ({
      ...e,
      context: [
        text.slice(0, e.offset).slice(-50),
        text.slice(e.offset, e.offset + e.length),
        text.slice(e.offset + e.length).slice(0, 50),
      ],
    })) ?? [];

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

// The information of the parent node during nested parsing.
interface ParentMeta {
  path: jsonc.JSONPath;
}

interface ParseNode extends Node {
  path: jsonc.JSONPath;
  parent?: ParseNode;
  childrenOffset?: Record<string, number>;
  childrenKeyLength?: Record<string, number>;
}

class Visitor {
  text: string;
  options?: ParseOptions;

  nodeMap: Record<string, ParseNode>;
  // The nodes of nested parsing.
  nestNodeMap: Record<string, Node>;
  parseErrors: jsonc.ParseError[];
  currentParent: ParseNode;
  parentMeta: ParentMeta; // The information of the parent node during nested parsing.

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
      keyLength: 0,
      boundOffset: 0,
      boundLength: 0,
      path: this.parentMeta.path,
      childrenKeys: [],
      childrenKey2Id: {},
      childrenOffset: {},
      childrenKeyLength: {},
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
      keyLength: 0,
      boundOffset: offset,
      boundLength: length,
      path,
      parent: this.currentParent,
    };

    if (isIterable(node)) {
      node.childrenKeys = [];
      node.childrenKey2Id = {};
      node.childrenOffset = {};
      node.childrenKeyLength = {};
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
    const childKeyLength = this.currentParent.childrenKeyLength?.[key];

    if (childOffset !== undefined) {
      child.boundOffset = childOffset;
      computeAndSetBoundLength(child);
    }
    if (childKeyLength !== undefined) {
      child.keyLength = childKeyLength;
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
    this.currentParent.childrenKeyLength![key] = key.length;
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
