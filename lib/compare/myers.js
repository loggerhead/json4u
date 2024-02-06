import {DEL, Diff, INS} from "./diff";

// 最大编辑距离，控制比较的深度。影响比较性能、用户感知到的耗时
const MaxEditLength = 1000;

export function arrayDiff(lvals, rvals, options = {}) {
  const lineArray = [""];
  const lineHash = {};
  let n = lineArray.length;

  // 将 array 映射成 unicode 字符串，然后进行 text compare
  const lines2chars = (lines) => {
    const baseChar = "0".charCodeAt(0);
    let chars = "";

    for (const line of lines) {
      if (lineHash.hasOwnProperty(line)) {
        chars += String.fromCharCode(baseChar + lineHash[line]);
      } else {
        chars += String.fromCharCode(baseChar + n);
        lineHash[line] = n;
        lineArray[n++] = line;
      }
    }

    return chars;
  };

  // 每一行是一个数组元素
  const llines = lvals.map((o) => `${o}`);
  const rlines = rvals.map((o) => `${o}`);
  // 每一个字符是一个数组元素
  const lchars = lines2chars(llines);
  const rchars = lines2chars(rlines);
  let lpos = 0;
  let rpos = 0;
  let diffs = [];

  diff(lchars, rchars, {...options, isArrayDiff: true}).forEach((d) => {
    const n = d.value.length;

    if (d.removed) {
      for (let i = 0; i < n; i++) {
        diffs.push(new Diff(lpos, 1, DEL));
        lpos++;
      }
    } else if (d.added) {
      for (let i = 0; i < n; i++) {
        diffs.push(new Diff(rpos, 1, INS));
        rpos++;
      }
    } else {
      lpos += n;
      rpos += n;
    }
  });

  return diffs;
}

// word 维度的 myers diff
export function myersDiff(a, b, options = {}) {
  let lpos = 0;
  let rpos = 0;
  // 如果超过 MaxEditLength 的长度时，不进行 inline diff
  let diffs = diff(a, b, options) || [];
  diffs = diffs.map((diff) => {
    const n = diff.value.length;
    let d = null;

    if (diff.removed) {
      d = new Diff(lpos, n, DEL);
      lpos += n;
    } else if (diff.added) {
      d = new Diff(rpos, n, INS);
      rpos += n;
    } else {
      lpos += n;
      rpos += n;
    }

    return d;
  }).filter((d) => d);

  // 对存在 diff 的 word 做优化，将 common prefix 和 suffix 从 diff 中去除
  for (let i = 0; i < diffs.length;) {
    const diff = diffs[i];
    const next = diffs[i + 1];

    if (diff.type === DEL && next?.type === INS) {
      // 去除公共前缀
      let n = Math.min(diff.length, next.length);
      for (let j = 0; j < n && a[diff.offset] === b[next.offset]; j++) {
        diff.offset++;
        next.offset++;
        diff.length--;
        next.length--;
      }

      // 去除公共后缀
      n = Math.min(diff.length, next.length);
      for (let j = 0; j < n && a[diff.offset + diff.length - 1] === b[next.offset + next.length - 1]; j++) {
        diff.length--;
        next.length--;
      }

      i += 2;
    } else {
      i++;
    }
  }

  diffs = diffs.filter((d) => d.length > 0);
  return diffs;
}

// copy from https://github.com/kpdecker/jsdiff
function diff(oldString, newString, options = {isArrayDiff: false, maxEditLength: MaxEditLength}) {
  const oldArray = options?.isArrayDiff ? oldString.split('') : tokenize(oldString).filter((c) => c);
  const newArray = options?.isArrayDiff ? newString.split('') : tokenize(newString).filter((c) => c);

  let newLen = newArray.length;
  let oldLen = oldArray.length;
  let editLength = 1;
  let maxEditLength = newLen + oldLen;
  maxEditLength = Math.min(maxEditLength, options?.maxEditLength || maxEditLength);
  let bestPath = [{newPos: -1, lastComponent: undefined}];

  // Seed editLength = 0, i.e. the content starts with the same values
  let oldPos = extractCommon(bestPath[0], newArray, oldArray, 0);
  if (bestPath[0].newPos + 1 >= newLen && oldPos + 1 >= oldLen) {
    // Identity per the equality and tokenizer
    return [{value: join(newArray), count: newArray.length}];
  }

  // Main worker method. checks all permutations of a given edit length for acceptance.
  const execEditLength = () => {
    for (let diagonalPath = -1 * editLength; diagonalPath <= editLength; diagonalPath += 2) {
      let basePath;
      let addPath = bestPath[diagonalPath - 1],
        removePath = bestPath[diagonalPath + 1],
        oldPos = (removePath ? removePath.newPos : 0) - diagonalPath;
      if (addPath) {
        // No one else is going to attempt to use this value, clear it
        bestPath[diagonalPath - 1] = undefined;
      }

      let canAdd = addPath && addPath.newPos + 1 < newLen,
        canRemove = removePath && 0 <= oldPos && oldPos < oldLen;
      if (!canAdd && !canRemove) {
        // If this path is a terminal then prune
        bestPath[diagonalPath] = undefined;
        continue;
      }

      // Select the diagonal that we want to branch from. We select the prior
      // path whose position in the new string is the farthest from the origin
      // and does not pass the bounds of the diff graph
      if (!canAdd || (canRemove && addPath.newPos < removePath.newPos)) {
        basePath = addToPath(removePath, undefined, true, 0);
      } else {
        basePath = addToPath(addPath, true, undefined, 1);
      }

      oldPos = extractCommon(basePath, newArray, oldArray, diagonalPath);

      // If we have hit the end of both strings, then we are done
      if (basePath.newPos + 1 >= newLen && oldPos + 1 >= oldLen) {
        return buildValues(basePath.lastComponent, newArray, oldArray);
      } else {
        // Otherwise track this path as a potential candidate and continue.
        bestPath[diagonalPath] = basePath;
      }
    }

    editLength++;
  };

  // Performs the length of edit iteration. Is a bit fugly as this has to support the
  // sync and async mode which is never fun. Loops over execEditLength until a value
  // is produced, or until the edit length exceeds options.maxEditLength (if given),
  // in which case it will return undefined.
  while (editLength <= maxEditLength) {
    let ret = execEditLength();
    if (ret) {
      return ret;
    }
  }
}

function addToPath(path, added, removed, newPosInc) {
  let last = path.lastComponent;
  if (last && last.added === added && last.removed === removed) {
    return {
      newPos: path.newPos + newPosInc,
      lastComponent: {count: last.count + 1, added: added, removed: removed, previousComponent: last.previousComponent},
    };
  } else {
    return {
      newPos: path.newPos + newPosInc,
      lastComponent: {count: 1, added: added, removed: removed, previousComponent: last},
    };
  }
}

function extractCommon(basePath, newString, oldString, diagonalPath) {
  let newLen = newString.length,
    oldLen = oldString.length,
    newPos = basePath.newPos,
    oldPos = newPos - diagonalPath,
    commonCount = 0;

  while (newPos + 1 < newLen && oldPos + 1 < oldLen && equals(newString[newPos + 1], oldString[oldPos + 1])) {
    newPos++;
    oldPos++;
    commonCount++;
  }

  if (commonCount) {
    basePath.lastComponent = {count: commonCount, previousComponent: basePath.lastComponent};
  }

  basePath.newPos = newPos;
  return oldPos;
}

function equals(left, right) {
  return left === right;
}

function tokenize(value) {
  // Based on https://en.wikipedia.org/wiki/Latin_script_in_Unicode
  //
  // Ranges and exceptions:
  // Latin-1 Supplement, 0080–00FF
  //  - U+00D7  × Multiplication sign
  //  - U+00F7  ÷ Division sign
  // Latin Extended-A, 0100–017F
  // Latin Extended-B, 0180–024F
  // IPA Extensions, 0250–02AF
  // Spacing Modifier Letters, 02B0–02FF
  //  - U+02C7  ˇ &#711;  Caron
  //  - U+02D8  ˘ &#728;  Breve
  //  - U+02D9  ˙ &#729;  Dot Above
  //  - U+02DA  ˚ &#730;  Ring Above
  //  - U+02DB  ˛ &#731;  Ogonek
  //  - U+02DC  ˜ &#732;  Small Tilde
  //  - U+02DD  ˝ &#733;  Double Acute Accent
  // Latin Extended Additional, 1E00–1EFF
  const extendedWordChars = /^[a-zA-Z\u{C0}-\u{FF}\u{D8}-\u{F6}\u{F8}-\u{2C6}\u{2C8}-\u{2D7}\u{2DE}-\u{2FF}\u{1E00}-\u{1EFF}]+$/u;

  // All whitespace symbols except newline group into one token, each newline - in separate token
  let tokens = value.split(/([^\S\r\n]+|[()[\]{}'"\r\n]|\b)/);

  // Join the boundary splits that we do not consider to be boundaries. This is primarily the extended Latin character set.
  for (let i = 0; i < tokens.length - 1; i++) {
    // If we have an empty string in the next field and we have only word chars before and after, merge
    if (!tokens[i + 1] && tokens[i + 2]
      && extendedWordChars.test(tokens[i])
      && extendedWordChars.test(tokens[i + 2])) {
      tokens[i] += tokens[i + 2];
      tokens.splice(i + 1, 2);
      i--;
    }
  }

  return tokens;
}

function join(chars) {
  return chars.join('');
}

function buildValues(lastComponent, newString, oldString) {
  // First we convert our linked list of components in reverse order to an
  // array in the right order:
  const components = [];
  let nextComponent;
  while (lastComponent) {
    components.push(lastComponent);
    nextComponent = lastComponent.previousComponent;
    delete lastComponent.previousComponent;
    lastComponent = nextComponent;
  }
  components.reverse();

  let componentPos = 0,
    componentLen = components.length,
    newPos = 0,
    oldPos = 0;

  for (; componentPos < componentLen; componentPos++) {
    let component = components[componentPos];
    if (!component.removed) {
      if (!component.added) {
        let value = newString.slice(newPos, newPos + component.count);
        value = value.map(function (value, i) {
          let oldValue = oldString[oldPos + i];
          return oldValue.length > value.length ? oldValue : value;
        });

        component.value = join(value);
      } else {
        component.value = join(newString.slice(newPos, newPos + component.count));
      }
      newPos += component.count;

      // Common case
      if (!component.added) {
        oldPos += component.count;
      }
    } else {
      component.value = join(oldString.slice(oldPos, oldPos + component.count));
      oldPos += component.count;

      // Reverse add and remove so removes are output first to match common convention
      // The diffing algorithm is tied to add then remove output and this is the simplest
      // route to get the desired output with minimal overhead.
      if (componentPos && components[componentPos - 1].added) {
        let tmp = components[componentPos - 1];
        components[componentPos - 1] = components[componentPos];
        components[componentPos] = tmp;
      }
    }
  }

  // Special case handle for when one terminal is ignored (i.e. whitespace).
  // For this case we merge the terminal into the prior string and drop the change.
  // This is only available for string mode.
  let finalComponent = components[componentLen - 1];
  if (componentLen > 1
    && typeof finalComponent.value === 'string'
    && (finalComponent.added || finalComponent.removed)
    && equals('', finalComponent.value)) {
    components[componentLen - 2].value += finalComponent.value;
    components.pop();
  }

  return components;
}
