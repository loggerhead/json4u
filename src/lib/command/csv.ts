import { Tree, TreeObject } from "@/lib/parser";
import Papa from "papaparse";

export interface CsvOptions {
  withHeader?: boolean;
}

export interface CsvResult {
  text?: string;
  errorKey?: string;
}

export function csv2json(text: string, options: CsvOptions = {}): CsvResult {
  const { data, errors, meta } = Papa.parse(text as any, {
    header: options.withHeader,
    skipEmptyLines: true,
  });

  let error = "";

  if (errors.length > 0) {
    error = errors[0].code;
  } else if (text.trim().length === 0) {
    error = "EmptyInput";
  } else if (meta.aborted) {
    error = "ParseError";
  }

  return {
    text: JSON.stringify(data),
    errorKey: error ? `CsvErr${error}` : undefined,
  };
}

export function json2csv(treeObject: TreeObject): CsvResult {
  const tree = Tree.fromObject(treeObject);
  const { json, errorKey } = toCsvJSON(tree);
  if (errorKey) {
    return { errorKey };
  }

  const text = Papa.unparse(json, {
    skipEmptyLines: true,
  });
  return { text };
}

function toCsvJSON(tree: Tree): { json?: any; errorKey?: string } {
  const root = tree.root();

  if (root?.type !== "array") {
    return { errorKey: "CsvCvrtErrNotArray" };
  }

  let hasHeader: boolean;
  let errorKey: string | undefined;

  const json = tree.mapChildren(root, (node, key) => {
    if (errorKey) {
      return;
    }

    if (hasHeader === undefined) {
      hasHeader = node.type === "object";
    }

    if (node.type === "object" && hasHeader) {
      const obj: Record<string, string> = {};
      tree.mapChildren(node, (child, key) => {
        obj[unquote(key)] = unquote(tree.stringifyNode(child, { pure: true }));
      });
      return obj;
    } else if (node.type === "array" && !hasHeader) {
      return tree.mapChildren(node, (child) => unquote(tree.stringifyNode(child, { pure: true })));
    } else {
      errorKey = "CsvCvrtErrNotMatchHeader";
      return;
    }
  });

  return { json, errorKey };
}

function unquote(s: string) {
  return s.startsWith('"') && s.endsWith('"') ? s.replace(/^"|"$/g, "") : s;
}
