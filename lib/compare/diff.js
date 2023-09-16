import * as range from "./range";

export const INS = "insert";
export const DEL = "delete";

export class DiffResult {
  constructor(diffs) {
    // 全部块差异
    this.diffs = diffs;

    // 左侧块差异
    this.ldiffs = [];
    // 右侧块差异
    this.rdiffs = [];

    this.purify();
    this.classify();
  }

  hunkDiffs() {
    return this.diffs
  }

  inlineDiffs() {
    return this.diffs.map((d) => {
      return d.inlineDiffs || []
    }).reduce((a, b) => a.concat(b), [])
  }

  apply(isLeft, fn) {
    const diffs = isLeft ? this.ldiffs : this.rdiffs;
    diffs.forEach((diff) => {
      fn(diff, false);

      if (diff.inlineDiffs) {
        diff.inlineDiffs.forEach((d) => fn(d, true));
      }
    });
  }

  // 生成区域
  genRanges(leditor, reditor) {
    this.apply(true, (d, inline) => {
      d.range = range.Range.fromDiff(leditor, d);
    });
    this.apply(false, (d, inline) => {
      d.range = range.Range.fromDiff(reditor, d);
    });
    return [this.ldiffs, this.rdiffs];
  }

  purify() {
    this.diffs = this.diffs.filter((d) => d.length > 0);
    return this.diffs;
  }

  // 将 diffs 按 type 分类
  classify() {
    this.ldiffs = this.diffs.filter((d) => d.type == DEL);
    this.rdiffs = this.diffs.filter((d) => d.type == INS);
    return [this.ldiffs, this.rdiffs];
  }

  // 排序。大小按优先级进行比较 (type, offset)
  sort() {
    this.diffs = sort(this.diffs)
    return this.diffs
  }
}

export function sort(diffs) {
  return diffs.sort((a, b) => {
    if (a.type !== b.type) {
      return a.type === DEL ? -1 : 1;
    } else {
      return a.offset - b.offset;
    }
  });
}

export class Diff {
  constructor(offset, length, type) {
    this.offset = offset; // 整个文档中的偏移量
    this.length = length; // 差异部分的长度
    this.type = type; // 差异类型
    this.range = null; // 差异区域
  }
}

// 块差异
export class HunkDiff extends Diff {
  constructor(offset, length, type) {
    super(offset, length, type);
    this.inlineDiffs = [];
  }
}

// 行内差异
export class InlineDiff extends Diff {
  constructor(offset, length, type) {
    super(offset, length, type);
  }
}
