import * as jsonc from "./jsonc-parser/main";

const options = {
  tabSize: 4,
  insertSpaces: true,
  eol: "",
};

export function format(text) {
  const edits = jsonc.format(text, undefined, options);
  return jsonc.applyEdits(text, edits);
}

export function tryFormat(text) {
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
    const subEdits = jsonc.format(
      text,
      {
        offset: start,
        length: end - start,
      },
      options
    );
    edits.push(...subEdits);
  }

  return edits.length ? jsonc.applyEdits(text, edits) : text;
}
