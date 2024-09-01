import { Diff, newDiff } from "./diff";

// 最大编辑距离，控制比较的深度。影响比较性能、用户感知到的耗时
export const MaxEditLength = 1000;

export interface DiffOptions {
  isArrayDiff?: boolean;
  maxEditLength?: number;
}

export function arrayDiff<T extends number | string | boolean | null>(
  lvals: T[],
  rvals: T[],
  options?: DiffOptions,
): Diff[] {
  const lineArray = [""];
  const lineHash: Record<string, number> = {};
  let n = lineArray.length;

  // 将 array 映射成 unicode 字符串，然后进行 text compare
  const lines2chars = (lines: string[]) => {
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
  const llines = lvals.map(String);
  const rlines = rvals.map(String);
  // 每一个字符是一个数组元素
  const lchars = lines2chars(llines);
  const rchars = lines2chars(rlines);
  let lpos = 0;
  let rpos = 0;
  const diffs: Diff[] = [];

  diff(lchars, rchars, { ...options, isArrayDiff: true }).forEach((d) => {
    const n = d.value?.length!;

    if (d.removed) {
      for (let i = 0; i < n; i++) {
        diffs.push(newDiff(lpos, 1, "del"));
        lpos++;
      }
    } else if (d.added) {
      for (let i = 0; i < n; i++) {
        diffs.push(newDiff(rpos, 1, "ins"));
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
export function myersDiff(a: string, b: string, options?: DiffOptions): Diff[] {
  let lpos = 0;
  let rpos = 0;
  // 如果超过 MaxEditLength 的长度时，不进行 inline diff
  const diffs = (diff(a, b, options) || [])
    .map((diff) => {
      const n = diff.value?.length!;
      let d = null;

      if (diff.removed) {
        d = newDiff(lpos, n, "del");
        lpos += n;
      } else if (diff.added) {
        d = newDiff(rpos, n, "ins");
        rpos += n;
      } else {
        lpos += n;
        rpos += n;
      }

      return d;
    })
    .filter((d) => d) as Diff[];

  // 对存在 diff 的 word 做优化，将 common prefix 和 suffix 从 diff 中去除
  let i = 0;

  while (i < diffs.length) {
    const diff = diffs[i];
    const next = diffs[i + 1];

    if (diff?.type === "del" && next?.type === "ins") {
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

  return diffs.filter((d) => d?.length);
}

interface Component {
  count: number;
  value?: string;
  added?: boolean;
  removed?: boolean;
  previousComponent?: Component;
}

interface Path {
  newPos: number;
  lastComponent?: Component;
}

// stolen from https://github.com/kpdecker/jsdiff
function diff(
  oldString: string,
  newString: string,
  options: DiffOptions = { isArrayDiff: false, maxEditLength: MaxEditLength },
): Component[] {
  const oldArray = options?.isArrayDiff ? oldString.split("") : tokenize(oldString).filter((c) => c);
  const newArray = options?.isArrayDiff ? newString.split("") : tokenize(newString).filter((c) => c);

  const newLen = newArray.length;
  const oldLen = oldArray.length;
  let editLength = 1;
  let maxEditLength = newLen + oldLen;
  maxEditLength = Math.min(maxEditLength, options?.maxEditLength || maxEditLength);
  const bestPath: (Path | undefined)[] = [{ newPos: -1, lastComponent: undefined }];

  // Seed editLength = 0, i.e. the content starts with the same values
  const oldPos = extractCommon(bestPath[0]!, newArray, oldArray, 0);
  if (bestPath[0]!.newPos + 1 >= newLen && oldPos + 1 >= oldLen) {
    // Identity per the equality and tokenizer
    return [{ value: newArray.join(""), count: newArray.length }];
  }

  // Main worker method. checks all permutations of a given edit length for acceptance.
  const execEditLength = (): Component[] | undefined => {
    for (let diagonalPath = -1 * editLength; diagonalPath <= editLength; diagonalPath += 2) {
      let basePath;
      const addPath = bestPath[diagonalPath - 1]!;
      const removePath = bestPath[diagonalPath + 1]!;
      let oldPos = (removePath ? removePath.newPos : 0) - diagonalPath;
      if (addPath) {
        // No one else is going to attempt to use this value, clear it
        bestPath[diagonalPath - 1] = undefined;
      }

      const canAdd = addPath && addPath.newPos + 1 < newLen;
      const canRemove = removePath && 0 <= oldPos && oldPos < oldLen;
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
    const ret = execEditLength();
    if (ret) {
      return ret;
    }
  }

  return [
    { value: oldArray.join(""), removed: true, count: 0 },
    { value: newArray.join(""), added: true, count: 0 },
  ];
}

function addToPath(
  path: Path,
  added: boolean | undefined,
  removed: boolean | undefined,
  newPosInc: number,
): { newPos: number; lastComponent: Component } {
  const last = path.lastComponent;
  return last && last.added === added && last.removed === removed
    ? {
        newPos: path.newPos + newPosInc,
        lastComponent: {
          count: last.count + 1,
          added,
          removed,
          previousComponent: last.previousComponent,
        },
      }
    : {
        newPos: path.newPos + newPosInc,
        lastComponent: {
          count: 1,
          added,
          removed,
          previousComponent: last,
        },
      };
}

function extractCommon(basePath: Path, newString: string[], oldString: string[], diagonalPath: number) {
  const newLen = newString.length;
  const oldLen = oldString.length;
  let newPos = basePath.newPos;
  let oldPos = newPos - diagonalPath;
  let commonCount = 0;

  while (newPos + 1 < newLen && oldPos + 1 < oldLen && newString[newPos + 1] === oldString[oldPos + 1]) {
    newPos++;
    oldPos++;
    commonCount++;
  }

  if (commonCount) {
    basePath.lastComponent = { count: commonCount, previousComponent: basePath.lastComponent };
  }

  basePath.newPos = newPos;
  return oldPos;
}

function tokenize(value: string): string[] {
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
  const extendedWordChars =
    /^[a-zA-Z\u{C0}-\u{FF}\u{D8}-\u{F6}\u{F8}-\u{2C6}\u{2C8}-\u{2D7}\u{2DE}-\u{2FF}\u{1E00}-\u{1EFF}]+$/u;

  // All whitespace symbols except newline group into one token, each newline - in separate token
  const tokens = value.split(/([^\S\r\n]+|[()[\]{}'"\r\n]|\b)/);

  // Join the boundary splits that we do not consider to be boundaries. This is primarily the extended Latin character set.
  for (let i = 0; i < tokens.length - 1; i++) {
    // If we have an empty string in the next field and we have only word chars before and after, merge
    if (!tokens[i + 1] && tokens[i + 2] && extendedWordChars.test(tokens[i]) && extendedWordChars.test(tokens[i + 2])) {
      tokens[i] += tokens[i + 2];
      tokens.splice(i + 1, 2);
      i--;
    }
  }

  return tokens;
}

function buildValues(lastComponent: Component | undefined, newString: string[], oldString: string[]) {
  // First we convert our linked list of components in reverse order to an
  // array in the right order:
  const components: Component[] = [];
  let nextComponent;
  while (lastComponent) {
    components.push(lastComponent);
    nextComponent = lastComponent.previousComponent;
    delete lastComponent.previousComponent;
    lastComponent = nextComponent;
  }
  components.reverse();

  const componentLen = components.length;
  let componentPos = 0;
  let newPos = 0;
  let oldPos = 0;

  for (; componentPos < componentLen; componentPos++) {
    const component = components[componentPos];
    if (!component.removed) {
      if (!component.added) {
        const value = newString.slice(newPos, newPos + component.count).map(function (value, i) {
          const oldValue = oldString[oldPos + i];
          return oldValue.length > value.length ? oldValue : value;
        });

        component.value = value.join("");
      } else {
        component.value = newString.slice(newPos, newPos + component.count).join("");
      }
      newPos += component.count;

      // Common case
      if (!component.added) {
        oldPos += component.count;
      }
    } else {
      component.value = oldString.slice(oldPos, oldPos + component.count).join("");
      oldPos += component.count;

      // Reverse add and remove so removes are output first to match common convention
      // The diffing algorithm is tied to add then remove output and this is the simplest
      // route to get the desired output with minimal overhead.
      if (componentPos && components[componentPos - 1].added) {
        const tmp = components[componentPos - 1];
        components[componentPos - 1] = components[componentPos];
        components[componentPos] = tmp;
      }
    }
  }

  // Special case handle for when one terminal is ignored (i.e. whitespace).
  // For this case we merge the terminal into the prior string and drop the change.
  // This is only available for string mode.
  const finalComponent = components[componentLen - 1];
  if (
    componentLen > 1 &&
    typeof finalComponent.value === "string" &&
    (finalComponent.added || finalComponent.removed) &&
    finalComponent.value === ""
  ) {
    components[componentLen - 2].value += finalComponent.value;
    components.pop();
  }

  return components;
}
