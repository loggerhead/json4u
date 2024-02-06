import {classify, DEL, DiffResult, HunkDiff, INS} from "./diff";
import {histogramDiff} from "./histogram";
import {arrayDiff, myersDiff} from "./myers";
import {parseJSON} from "../parser";

/**
 * 语义化比较文本的差异。如果不能语义化比较，则降级成文本比较
 * @param {string} ltext - 左侧文本
 * @param {string} rtext - 右侧文本
 * @param {boolean} needTextCompare -进行文本比较吗？
 * @returns {DiffResult} 语义化差异
 */
export function smartCompare(ltext, rtext, needTextCompare = false) {
  let lnode;
  let rnode;

  if (!needTextCompare) {
    lnode = parseJSON(ltext);
    rnode = parseJSON(rtext);
  }

  // JSON 解析失败时，走文本比较
  const isTextCompare = needTextCompare || lnode?.hasError() || rnode?.hasError();
  const diffs = isTextCompare ? compareHunkTexts(ltext, rtext) : new Comparer().compare(lnode, rnode);
  const diffResult = new DiffResult(diffs);
  diffResult.isTextCompare = isTextCompare;
  return diffResult;
}

// 比较器
export class Comparer {
  constructor() {
    // 比较出来的块差异
    this.diffs = [];
  }

  compare(ltree, rtree) {
    this.diff(ltree, rtree);
    return this.diffs;
  }

  // 创建差异
  newDiff(node, type) {
    return new HunkDiff(node.offset, node.length, type);
  }

  // 行内 diff 转成全局 diff
  newInlineDiffs(node, inlineDiffs) {
    return inlineDiffs.map((d) => {
      d.offset += node.offset;
      return d;
    });
  }

  // 比较值
  diff(lnode, rnode) {
    if (lnode.isArray() && rnode.isArray()) {
      this.diffArray(lnode, rnode);
      return this;
    } else if (lnode.isObject() && rnode.isObject()) {
      this.diffObject(lnode, rnode);
      return this;
    }

    let ldiff;
    let rdiff;
    const ltext = lnode.getToken();
    const rtext = rnode.getToken();

    if (lnode.type !== rnode.type || ltext !== rtext) {
      ldiff = this.newDiff(lnode, DEL);
      rdiff = this.newDiff(rnode, INS);
    }

    // 类型一样时，进行行内比较
    if (lnode.type === rnode.type && ltext !== rtext) {
      const [lInlineDiffs, rInlineDiffs] = classify(compareInlineTexts(ltext, rtext));
      ldiff.inlineDiffs = this.newInlineDiffs(lnode, lInlineDiffs);
      rdiff.inlineDiffs = this.newInlineDiffs(rnode, rInlineDiffs);
    }

    if (ldiff) {
      this.diffs.push(ldiff);
    }
    if (rdiff) {
      this.diffs.push(rdiff);
    }
    return this;
  }

  // 比较数组
  diffArray(lnode, rnode) {
    const diffs = compareArray(lnode.getValues(), rnode.getValues());
    const [delDiffs, insDiffs] = classify(diffs);
    const n = Math.max(delDiffs.length, insDiffs.length);

    for (let i = 0; i < n; i++) {
      const delDiff = delDiffs[i];
      const insDiff = insDiffs[i];
      // 数组下标
      const l = delDiff?.offset;
      const r = insDiff?.offset;

      if (delDiff && insDiff && l === r) {
        // 如果两边差异的下标相同，则递归比较
        this.diff(lnode.getValueNode(l), rnode.getValueNode(r));
      } else {
        if (delDiff) {
          this.diffs.push(this.newDiff(lnode.getKeyNode(l), DEL));
        }
        if (insDiff) {
          this.diffs.push(this.newDiff(rnode.getKeyNode(r), INS));
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
 * @returns {Diff[]} 行内差异。其中 offset 表示行内差异的起始位置
 */
export function compareHunkTexts(ltext, rtext) {
  return histogramDiff(ltext, rtext);
}

/**
 * 比较两个字符串的差异
 * @param {string} ltext - 左侧字符串
 * @param {string} rtext - 右侧字符串
 * @returns {Diff[]} 行内差异。其中 offset 表示行内差异的起始位置
 */
export function compareInlineTexts(ltext, rtext) {
  return myersDiff(ltext, rtext, {maxEditLength: 100});
}

/**
 * 比较两个数组的差异
 * @param {any[]} lvals - 左侧数组。数组内元素必须是基础类型
 * @param {any[]} rvals - 右侧数组
 * @returns {Diff[]} 数组差异。其中 offset 表示数组中元素的下标
 */
export function compareArray(lvals, rvals) {
  return arrayDiff(lvals, rvals, {maxEditLength: 1000});
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
