import { prettyFormat } from "@/lib/format/pretty";
import { type Graph, Layouter, genFlowNodes } from "@/lib/graph/layout";
import { parseJSON, type StringifyOptions, type TreeObject } from "@/lib/parser";
import { genDomString } from "@/lib/table";
import { isEmpty } from "lodash-es";

export interface ParseAndFormatOptions extends StringifyOptions {
  needTable: boolean;
  needGraph: boolean;
}

export interface ParsedTree {
  treeObject: TreeObject;
  graph?: Graph;
  tableHTML?: string;
}

export async function parseAndFormat(
  text: string,
  version: number,
  options?: ParseAndFormatOptions,
): Promise<ParsedTree> {
  // 5MB costs 240ms
  const tree = parseJSON(text, options);
  tree.version = version;

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

  let graph = undefined;
  // 5MB costs 260ms
  if (options?.needGraph) {
    const { nodes, edges } = genFlowNodes(tree);
    const { ordered, levelMeta } = new Layouter(tree, nodes, edges).layout();
    graph = { nodes: ordered, edges, levelMeta };
  }

  // 5MB costs 230ms
  const tableHTML = options?.needTable ? genDomString(tree) : undefined;
  return { treeObject: tree.toObject(), tableHTML, graph };
}
