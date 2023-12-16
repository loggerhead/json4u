import * as jsonc from "./jsonc-parser/main";
import {repeat} from "./parser";
import {format as prettyFormat} from "./prettier";

/**
 * 格式化 JSON 字符串
 * @param {string} text - JSON 字符串
 * @param {ParseOptions} options - 解析配置
 * @returns {string} 格式化结果
 */
export async function format(text, options = {}) {
  if (text.trim().length === 0) {
    return "";
  } else if (options.forcePretty) {
    return await prettyFormat(text, tryFormat, options);
  } else if (options.forceRawFormat || text.length > 100000) {
    return tryFormat(text);
  }

  const pairs = findBracketPairs(text);
  const edits = [];

  for (const [start, end] of pairs) {
    const subtext = text.substring(start, end);
    const formatted = await prettyFormat(subtext, tryFormat, options);

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

export function findBracketPairs(text) {
  const lbrackets = {
    "{": "}",
    "[": "]",
  };
  const rbrackets = {
    "}": "{",
    "]": "[",
  };
  const seen = [];
  let pairs = [];

  for (let i = 0; i < text.length; i++) {
    const c = text[i];

    if (lbrackets[c]) {
      seen.push([c, i]);
    } else if (rbrackets[c]) {
      const last = seen[seen.length - 1];

      if (last && rbrackets[c] === last[0]) {
        const [_, start] = seen.pop();
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
    if (lastStart + 1 === start && lastEnd - 1 === end && text[lastStart] === '{' && text[start] === '{') {
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

// copy from https://github.com/zgrossbart/jdd/blob/main/jsl/jsl.format.js
export function tryFormat(json) {
  let i = 0;
  let il = 0;
  let tab = "    ";
  let newJson = "";
  let indentLevel = 0;
  let inString = false;
  let c = null;

  for (i = 0, il = json.length; i < il; i += 1) {
    c = json.charAt(i);

    if (c === '"') {
      // 如果不是 \"
      if (i > 0 && json.charAt(i - 1) !== "\\") {
        inString = !inString;
      }
      newJson += c;
      continue;
    } else if (inString) {
      newJson += c;
      continue;
    }

    switch (c) {
      case "{":
      case "[":
        newJson += c + "\n" + repeat(tab, indentLevel + 1);
        indentLevel += 1;
        break;
      case "}":
      case "]":
        indentLevel -= 1;
        newJson += "\n" + repeat(tab, indentLevel) + c;
        break;
      case ",":
        newJson += ",\n" + repeat(tab, indentLevel);
        break;
      case ":":
        newJson += ": ";
        break;
      case " ":
      case "\n":
      case "\t":
        break;
      default:
        newJson += c;
        break;
    }
  }

  return newJson.trim();
}
