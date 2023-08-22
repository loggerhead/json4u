import * as jsonc from "./jsonc-parser/main";

export function tryFormat(text) {
  if (text.length > 100000) {
    return format(text);
  }

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

  // 找出范围最大，无交集的括号对
  for (let i = 0; i < text.length; i++) {
    const c = text[i];

    if (lbrackets[c]) {
      seen.push(c);

      // 只有第一个左括号才会记录位置，它内部的括号不用记录位置
      if (seen.length === 1) {
        pairs.push([i, i]);
      }
    } else if (rbrackets[c]) {
      // 如果是配对的括号
      if (rbrackets[c] === seen[seen.length - 1]) {
        seen.pop();
      }

      // slice 是左闭右开，所以需要 +1
      if (seen.length === 0 && pairs.length) {
        pairs[pairs.length - 1][1] = i + 1;
      }
    }
  }

  pairs = pairs.filter((pair) => pair[1] > pair[0]);
  const edits = [];

  for (const [start, end] of pairs) {
    const content = format(text.substring(start, end));
    edits.push({
      offset: start,
      length: end - start,
      content: content,
    });
  }

  return edits.length ? jsonc.applyEdits(text, edits) : text;
}

// copy from https://github.com/zgrossbart/jdd/blob/main/jsl/jsl.format.js
export function format(json) {
  var i = 0,
    il = 0,
    tab = "    ",
    newJson = "",
    indentLevel = 0,
    inString = false,
    currentChar = null;

  for (i = 0, il = json.length; i < il; i += 1) {
    currentChar = json.charAt(i);

    switch (currentChar) {
      case "{":
      case "[":
        if (!inString) {
          newJson += currentChar + "\n" + repeat(tab, indentLevel + 1);
          indentLevel += 1;
        } else {
          newJson += currentChar;
        }
        break;
      case "}":
      case "]":
        if (!inString) {
          indentLevel -= 1;
          newJson += "\n" + repeat(tab, indentLevel) + currentChar;
        } else {
          newJson += currentChar;
        }
        break;
      case ",":
        if (!inString) {
          newJson += ",\n" + repeat(tab, indentLevel);
        } else {
          newJson += currentChar;
        }
        break;
      case ":":
        if (!inString) {
          newJson += ": ";
        } else {
          newJson += currentChar;
        }
        break;
      case " ":
      case "\n":
      case "\t":
        if (inString) {
          newJson += currentChar;
        }
        break;
      case '"':
        if (i > 0 && json.charAt(i - 1) !== "\\") {
          inString = !inString;
        }
        newJson += currentChar;
        break;
      default:
        newJson += currentChar;
        break;
    }
  }

  return newJson;
}

function repeat(s, count) {
  return new Array(count + 1).join(s);
}
