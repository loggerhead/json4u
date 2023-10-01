import * as compare from "./diff";

export class Range {
  constructor(startLineNumber, endLineNumber, startColumn = 1, endColumn = 1) {
    this.startLineNumber = startLineNumber;
    this.endLineNumber = endLineNumber;
    this.startColumn = startColumn;
    this.endColumn = endColumn;
    this.offset = 0;
    this.length = 0;
  }

  static fromDiff(editor, diff) {
    const range = editor.range(diff.offset, diff.length);
    range.offset = diff.offset;
    range.length = diff.length;

    // 如果区域长度为 1 并且列号都为 1，说明只有一个换行符，此时校准一下，避免高亮展示到下一行
    if (range.length === 1 && range.startColumn === 1 && range.endColumn === 1) {
      range.endLineNumber = range.startLineNumber;
    }
    return range;
  }

  minus(n) {
    let range = {...this};
    range.startLineNumber -= n;
    range.endLineNumber -= n;
    return range;
  }

  count() {
    return this.endLineNumber > 0 ? this.endLineNumber - this.startLineNumber + 1 : 0;
  }
}

// 生成填充块的 ranges
export function generateFillRanges(hunkDiffs) {
  const lfills = [];
  const rfills = [];
  // laggr: 填充块填充的累积行数
  let laggr = 0;
  let raggr = 0;
  let last = null;

  // 需要多遍历一次，处理最后一个 last
  for (let i = 0; i <= hunkDiffs.length; i++) {
    const diff = hunkDiffs[i];
    // last、diff 分别是删除和新增时，ls、le、rs、re 才有意义
    const ls = last ? (last.range.startLineNumber + laggr) : 0;
    const le = last ? (last.range.endLineNumber + laggr) : 0;
    const rs = diff ? (diff.range.startLineNumber + raggr) : 0;
    const re = diff ? (diff.range.endLineNumber + raggr) : 0;
    // 如果两者不重合
    const mismatching = le < rs || re < ls;
    // 待添加的填充块
    let lf;
    let rf;

    // 如果相邻的差异分别是删除和新增，并且两者有重合
    if (last?.type === compare.DEL && diff?.type === compare.INS && !mismatching) {
      // 注意：因为 ls === rs 恒成立，所以永远是在下方填充
      if (le <= re) {
        lf = new Range(Math.max(le + 1, rs), re);
      } else if (re < le) {
        rf = new Range(Math.max(re + 1, ls), le);
      }

      last = null;
    } else {
      if (last) {
        const s = last.range.startLineNumber;
        const e = last.range.endLineNumber;

        if (last.type === compare.DEL) {
          rf = new Range(s + laggr, e + laggr);
        } else if (last.type === compare.INS) {
          lf = new Range(s + raggr, e + raggr);
        }
      }

      last = diff;
    }

    if (lf && lf.count() > 0) {
      lfills.push(lf.minus(laggr));
      laggr += lf.count();
    }

    if (rf && rf.count() > 0) {
      rfills.push(rf.minus(raggr));
      raggr += rf.count();
    }
  }

  return [lfills, rfills];
}
