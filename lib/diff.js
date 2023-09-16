import { diff_match_patch, DIFF_DELETE, DIFF_INSERT, DIFF_EQUAL } from "diff-match-patch";
import { parseJSON } from "./parser";
import * as pointer from "./pointer";

export const INS = "insert";
export const DEL = "delete";

/**
 * 语义化比较文本的差异。如果不能语义化比较，则降级成文本比较
 * @param {string} ltext - 左侧文本
 * @param {string} rtext - 右侧文本
 * @returns {SemanticDiff} 语义化差异
 */
export function semanticCompare(ltext, rtext) {
  const [ltree, lerrors] = parseJSON(ltext);
  const [rtree, rerrors] = parseJSON(rtext);
  // JSON 解析失败时，走文本比较
  const isTextCompare = Boolean(lerrors.length || rerrors.length);
  let diffs;

  if (isTextCompare) {
    diffs = compareText(ltext, rtext, true);
  } else {
    diffs = new Comparer().compare(ltree, rtree);
  }

  diffs = Diff.sort(diffs);
  return new SemanticDiffResult(diffs, isTextCompare);
}

// 语义化差异
export class SemanticDiffResult {
  constructor(diffs = [], isTextCompare = false) {
    this.diffs = diffs;
    // 是文本比较吗？
    this.isTextCompare = isTextCompare;
    this.leftBlockRanges = [];
    this.rightBlockRanges = [];
    this.leftInlineRanges = [];
    this.rightInlineRanges = [];
  }

  genRanges(leftEditor, rightEditor) {
    const [leftBlockRanges, leftInlineRanges] = this.genBlockRanges(leftEditor, DEL);
    const [rightBlockRanges, rightInlineRanges] = this.genBlockRanges(rightEditor, INS);
    this.leftBlockRanges = leftBlockRanges;
    this.rightBlockRanges = rightBlockRanges;
    this.leftInlineRanges = leftInlineRanges;
    this.rightInlineRanges = rightInlineRanges;
  }

  // 生成块差异
  genBlockRanges(editor, wantType) {
    let lineRanges = [];
    const inlineRanges = [];
    const diffs = this.diffs.filter((d) => d.type === wantType);

    for (const { offset, length, highlightLine } of diffs) {
      const range = editor.range(offset, length);
      lineRanges.push(range);

      if (!highlightLine) {
        inlineRanges.push({ ...range });
      }
    }

    lineRanges = this.mergeLineRanges(lineRanges);
    return [lineRanges, inlineRanges];
  }

  // 合并行差异，生成块差异
  mergeLineRanges(ranges) {
    if (ranges.length === 0) {
      return [];
    }

    ranges = ranges.sort((a, b) => a.startLineNumber - b.startLineNumber);
    const merged = [ranges[0]];

    for (let i = 1; i < ranges.length; i++) {
      const range = ranges[i];
      const lastRange = merged[merged.length - 1];

      // +1 是因为挨着的行也算在同一个 block
      if (range.startLineNumber <= lastRange.endLineNumber + 1) {
        lastRange.endLineNumber = Math.max(range.endLineNumber, lastRange.endLineNumber);
      } else {
        merged.push(range);
      }
    }

    for (const range of merged) {
      range.startColumn = 1;
      range.endColumn = 1;
    }
    return merged;
  }
}

// 差异
export class Diff {
  constructor(offset, length, type, highlightLine = true) {
    this.offset = offset; // 整个文档中的偏移量
    this.length = length; // 差异部分的长度
    this.type = type; // 差异类型
    this.highlightLine = highlightLine; // 高亮整行
    this.node = null; // diff 关联的解析树节点
  }

  static newFromNode(node, type, highlightLine = true) {
    const diff = new Diff(node.offset, node.length, type, highlightLine);
    diff.node = node;
    return diff;
  }

  // 将 diffs 按 type 分类
  static classify(diffs) {
    const delDiffs = diffs.filter((d) => d.type == DEL);
    const insDiffs = diffs.filter((d) => d.type == INS);
    return [delDiffs, insDiffs];
  }

  // 排序。大小按优先级进行比较 (type, offset)
  static sort(diffs) {
    diffs.sort((a, b) => {
      if (a.type !== b.type) {
        return a.type === DEL ? -1 : 1;
      } else {
        return a.offset - b.offset;
      }
    });
    return diffs;
  }
}

// 比较器
export class Comparer {
  constructor() {
    // 比较出来的差异
    this.diffs = [];
  }

  compare(ltree, rtree) {
    this.diff(ltree, rtree);
    this.diffs = Diff.sort(this.diffs);
    return this.diffs;
  }

  // 创建差异
  newDiff(node, type, highlightLine = true) {
    return Diff.newFromNode(node, type, highlightLine);
  }

  // 行内 diff 转成全局 diff
  newInlineDiffs(lnode, rnode, inlineDiffs) {
    return inlineDiffs.map((d) => {
      const node = d.type === DEL ? lnode : rnode;
      d.offset += node.offset;
      d.highlightLine = false;
      return d;
    });
  }

  // 比较值
  diff(lnode, rnode) {
    if (lnode.isArray() && rnode.isArray()) {
      this.diffArray(lnode, rnode);
    } else if (lnode.isObject() && rnode.isObject()) {
      this.diffObject(lnode, rnode);
    } else {
      // 类型一样时，进行字符比较
      if (lnode.type === rnode.type) {
        const ltext = lnode.getToken();
        const rtext = rnode.getToken();

        if (ltext !== rtext) {
          const inlineDiffs = compareText(ltext, rtext);
          this.diffs.push(...this.newInlineDiffs(lnode, rnode, inlineDiffs));
        }
      } else {
        this.diffs.push(this.newDiff(lnode, DEL));
        this.diffs.push(this.newDiff(rnode, INS));
      }
    }

    return this;
  }

  // 比较数组
  diffArray(lnode, rnode) {
    // 数组维度的 diff
    const diffs = compareArray(lnode.getValues(), rnode.getValues());
    const [delDiffs, insDiffs] = Diff.classify(Diff.sort(diffs));
    const n = Math.max(delDiffs.length, insDiffs.length);

    for (let i = 0; i < n; i++) {
      const delDiff = delDiffs[i];
      const insDiff = insDiffs[i];
      // 数组下标
      const li = delDiff?.offset;
      const ri = insDiff?.offset;

      if (delDiff && insDiff) {
        // 如果两边差异的下标相同，则递归比较
        if (li === ri) {
          this.diff(lnode.getValueNode(li), rnode.getValueNode(ri));
        } else {
          this.diffs.push(this.newDiff(lnode.getKeyNode(li), DEL));
          this.diffs.push(this.newDiff(rnode.getKeyNode(ri), INS));
        }
      } else {
        if (delDiff) {
          this.diffs.push(this.newDiff(lnode.getKeyNode(li), DEL));
        } else {
          this.diffs.push(this.newDiff(rnode.getKeyNode(ri), INS));
        }
      }
    }

    return this;
  }

  // 比较对象
  diffObject(lnode, rnode) {
    const [commonKeys, leftOnlyKeys, rightOnlyKeys] = splitKeys(lnode.getKeys(), rnode.getKeys());

    // 比较相同的 key
    commonKeys.forEach((k) => {
      this.diff(lnode.getValueNode(k), rnode.getValueNode(k));
    });

    // 将左右两侧剩余的 key 全都算作差异
    leftOnlyKeys.forEach((k) => {
      const d = this.newDiff(lnode.getKeyNode(k), DEL);
      this.diffs.push(d);
    });

    rightOnlyKeys.forEach((k) => {
      const d = this.newDiff(rnode.getKeyNode(k), INS);
      this.diffs.push(d);
    });

    return this;
  }
}

/**
 * 比较两个字符串的差异
 * @param {string} ltext - 左侧字符串
 * @param {string} rtext - 右侧字符串
 * @param {boolean} ignoreBlank - 忽略首尾空白符
 * @returns {Diff[]} 行内差异。其中 offset 表示行内差异的起始位置
 */
export function compareText(ltext, rtext, ignoreBlank = false) {
  let lpos = 0;
  let rpos = 0;
  const diffs = [];

  const dmp = new diff_match_patch();
  let dd = dmp.diff_main(ltext, rtext);
  // 将差异整理成可读性更高的形式 https://github.com/google/diff-match-patch/wiki/Line-or-Word-Diffs
  dmp.diff_cleanupSemantic(dd);

  for (let i = 0; i < dd.length; i++) {
    const [dtype, text] = dd[i];
    const n = text.length;

    if (dtype === DIFF_EQUAL) {
      lpos += n;
      rpos += n;
    } else if (dtype === DIFF_DELETE || dtype == DIFF_INSERT) {
      const ln = ignoreBlank ? n - text.trimStart().length : 0;
      const rn = ignoreBlank ? n - text.trimEnd().length : 0;
      // 忽略首尾空白符以后剩余的字符数
      const remain = n - ln - rn;

      if (dtype === DIFF_DELETE) {
        if (remain > 0) {
          diffs.push(new Diff(lpos + ln, remain, DEL, false));
        }
        lpos += n;
      } else {
        if (remain > 0) {
          diffs.push(new Diff(rpos + ln, remain, INS, false));
        }
        rpos += n;
      }
    }
  }

  return diffs;
}

/**
 * 比较两个数组的差异
 * @param {any[]} lvals - 左侧数组。数组内元素必须是基础类型
 * @param {any[]} rvals - 右侧数组
 * @returns {Diff[]} 数组差异。其中 offset 表示数组中元素的下标
 */
export function compareArray(lvals, rvals) {
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
  let dmp = new diff_match_patch();
  let dd = dmp.diff_main(lchars, rchars, false);

  let lidx = 0;
  let ridx = 0;
  const diffs = [];

  for (let i = 0; i < dd.length; i++) {
    // text 表示行的内容。比如：
    //
    //     ldata = [1, 2, 3]
    //     rdata = [1, 3]
    //     dd 为 [(0, 'a'), (-1, 'b'), (0, 'c')]
    //     text 为 'a'、'b'、'c'，分别表示数组中的第 1、2、3 个元素
    const [dtype, text] = dd[i];

    for (let j = 0; j < text.length; j++) {
      if (dtype === DIFF_EQUAL) {
        lidx++;
        ridx++;
      } else if (dtype === DIFF_DELETE) {
        diffs.push(new Diff(lidx, 1, DEL));
        lidx++;
      } else if (dtype === DIFF_INSERT) {
        diffs.push(new Diff(ridx, 1, INS));
        ridx++;
      }
    }
  }

  return diffs;
}

/**
 * 分离共同、差异
 * @returns {[Set, Set, Set]} 依次为：共同、左侧、右侧
 */
export function splitKeys(lkeys, rkeys) {
  const intersection = new Set();
  const leftOnly = new Set(lkeys);
  const rightOnly = new Set(rkeys);

  leftOnly.forEach((v) => {
    if (rightOnly.has(v)) {
      intersection.add(v);
      leftOnly.delete(v);
      rightOnly.delete(v);
    }
  });

  return [intersection, leftOnly, rightOnly];
}
