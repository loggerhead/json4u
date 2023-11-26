import * as jsonc from "./jsonc-parser/main";

export function format(text) {
  if (text.length > 100000) {
    return doFormat(text);
  }

  const pairs = findBracketPairs(text);
  const edits = [];

  for (const [start, end] of pairs) {
    const content = doFormat(text.substring(start, end));
    edits.push({
      offset: start,
      length: end - start,
      content: content,
    });
  }

  return edits.length ? jsonc.applyEdits(text, edits) : text;
}

function findBracketPairs(text) {
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

    if (pair[0] <= lastPair[1]) {
      lastPair[1] = Math.max(pair[1], lastPair[1]);
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
function doFormat(json) {
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

  return newJson;
}

function repeat(s, count) {
  count = count < 0 ? 0 : count;
  return new Array(count + 1).join(s);
}
