import { type Kind } from "@/lib/editor/editor";
import { prettyFormat } from "@/lib/format/pretty";
import type { Graph } from "@/lib/graph/types";
import { parseJSON, type StringifyOptions, type TreeObject } from "@/lib/parser";
import { getViewState } from "@/lib/worker/stores/viewStore";
import { isEmpty } from "lodash-es";

export interface ParseAndFormatOptions extends StringifyOptions {
  kind: Kind;
}

export interface ParsedTree {
  treeObject: TreeObject;
  graph?: Graph;
  tableHTML?: string;
}

export async function parseAndFormat(
  text: string,
  options?: ParseAndFormatOptions,
): Promise<ParsedTree> {
  // 5MB costs 240ms
  const tree = parseJSON(text, options);

  if (options?.kind === "main") {
    getViewState().setTree(tree);
  }

  if (!tree.valid()) {
    if (options?.format) {
      tree.text = prettyFormat(text, options);
    }
    return { treeObject: tree.toObject() };
  }

  if (options?.format) {
    // 5MB costs 69ms
    tree.stringify(options);
  } else if (!isEmpty(tree.nestNodeMap)) {
    tree.stringifyNestNodes();
  }

  return { treeObject: tree.toObject() };
}
