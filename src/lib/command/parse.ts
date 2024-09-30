import { format as textFormat } from "@/lib/format";
import { type Graph, Layouter, genFlowNodes } from "@/lib/graph/layout";
import { parseJSON, type ParseOptions, type StringifyOptions, type TreeObject } from "@/lib/parser";
import { genDomString } from "@/lib/table";
import * as jsonc from "jsonc-parser";
import { isEmpty } from "lodash-es";

const fallbackThreshold = 100000;

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
      tree.text = format(text, options);
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

export function format(text: string, options?: ParseOptions): string {
  if (text.length > fallbackThreshold) {
    return textFormat(text, options);
  }

  const pairs = findBracketPairs(text);
  const edits = [];

  for (const [start, end] of pairs) {
    const subtext = text.substring(start, end);
    const formatted = prettyFormatWithFallback(subtext, options);

    edits.push({
      offset: start,
      length: end - start,
      content: formatted,
    });
  }

  if (edits.length > 0) {
    text = jsonc.applyEdits(text, edits).trim();
  }

  return text;
}

function prettyFormatWithFallback(json: string, options?: ParseOptions): string {
  const tree = parseJSON(json);
  return tree.valid() ? tree.stringify({ format: true }) : textFormat(json, options);
}

function findBracketPairs(text: string): [number, number][] {
  const lbrackets: Record<string, string> = {
    "{": "}",
    "[": "]",
  };
  const rbrackets: Record<string, string> = {
    "}": "{",
    "]": "[",
  };
  const seen: [string, number][] = [];
  let pairs: [number, number][] = [];

  for (let i = 0; i < text.length; i++) {
    const c = text[i];

    if (lbrackets[c]) {
      seen.push([c, i]);
    } else if (rbrackets[c]) {
      const last = seen[seen.length - 1];

      if (last && rbrackets[c] === last[0]) {
        const [_, start] = seen.pop()!;
        pairs.push([start, i]);
      }
    }
  }

  // 没有匹配的另一半括号时，也将其加入 pairs 中，以便能够格式化
  if (seen.length > 0) {
    pairs.push([seen[0][1], text.length - 1]);
  }

  pairs = pairs.filter((pair) => pair[1] > pair[0]).sort((a, b) => a[0] - b[0]);
  if (pairs.length === 0) {
    return [];
  }

  let merged = [pairs[0]];

  // 找出范围最大的括号对
  for (let i = 1; i < pairs.length; i++) {
    const pair = pairs[i];
    const lastPair = merged[merged.length - 1];
    const [start, end] = pair;
    const [lastStart, lastEnd] = lastPair;

    // 如果是 {{...}}，保留最后一个 {} 的位置
    if (lastStart + 1 === start && lastEnd - 1 === end && text[lastStart] === "{" && text[start] === "{") {
      merged.pop();
      merged.push(pair);
      // 如果是 {[...]}，保留 {} 的位置
    } else if (lastEnd >= start) {
      lastPair[1] = Math.max(end, lastEnd);
    } else {
      merged.push(pair);
    }
  }

  // slice 是左闭右开，所以需要 +1
  merged = merged.map((pair) => {
    pair[1]++;
    return pair;
  });
  return merged;
}

if (import.meta.vitest) {
  const { it, expect } = import.meta.vitest;

  describe("findBracketPairs", () => {
    it("multiple {} pairs", () => {
      const pp = findBracketPairs("{{{}}} {{}}");
      expect(pp).toEqual([
        [2, 4],
        [8, 10],
      ]);
    });

    it("simple", () => {
      const pp = findBracketPairs("{[]} []");
      expect(pp).toEqual([
        [0, 4],
        [5, 7],
      ]);
    });
  });
}
