export class Range {
  constructor(startLineNumber, endLineNumber, startColumn = 1, endColumn = 1) {
    this.startLineNumber = startLineNumber;
    this.endLineNumber = endLineNumber;
    this.startColumn = startColumn;
    this.endColumn = endColumn;
  }

  static fromDiff(editor, diff) {
    return editor.range(diff.offset, diff.length);
  }

  move(n) {
    this.startLineNumber += n;
    this.endLineNumber += n;
    return this;
  }

  count() {
    return this.endLineNumber > 0 ? this.endLineNumber - this.startLineNumber + 1 : 0;
  }
}

// 合并行差异，生成升序的块差异
export function mergeLineRanges(ranges) {
  if (ranges.length === 0) {
    return [];
  }

  ranges = sortRanges(ranges);
  const merged = [];
  let lastRange = { ...ranges[0] };

  for (const range of ranges.slice(1)) {
    // +1 是因为挨着的行也算在同一个 block
    if (lastRange.endLineNumber + 1 >= range.startLineNumber) {
      lastRange.endLineNumber = Math.max(range.endLineNumber, lastRange.endLineNumber);
    } else {
      merged.push(lastRange);
      lastRange = { ...range };
    }
  }

  merged.push(lastRange);
  return merged;
}

// 删除行内差异
export function removeInlineRanges(model, ranges) {
  return ranges.filter((range) => {
    return (
      range.startLineNumber < range.endLineNumber ||
      (range.startLineNumber == range.endLineNumber &&
        range.startColumn == 1 &&
        range.endColumn == model.getLineLength(range.startLineNumber))
    );
  });
}

// 生成填充块的 ranges
export function generateFillRanges(leftRanges, rightRanges) {
  const lranges = sortRanges(leftRanges);
  const rranges = sortRanges(rightRanges);
  const lfills = [];
  const rfills = [];
  // l: 下标
  // lb: 上一个边界
  // laggr: 填充块填充的累积行数
  let [l, r, lb, rb, laggr, raggr] = new Array(6).fill(0);

  while (l < lranges.length || r < rranges.length) {
    const ls = l < lranges.length ? lranges[l].startLineNumber + laggr : 0;
    const le = l < lranges.length ? lranges[l].endLineNumber + laggr : 0;
    const rs = r < rranges.length ? rranges[r].startLineNumber + raggr : 0;
    const re = r < rranges.length ? rranges[r].endLineNumber + raggr : 0;
    // 待添加的填充块
    let lf;
    let rf;

    // 左侧第一个的情况可以跳过，会被第一个 if 或第二个 if 处理
    if (lb <= re) {
      if (lb > 0) {
        lf = new Range(Math.max(lb + 1, rs), re);
        // 左侧为空
      } else if (lb == 0 && ls == 0) {
        lf = new Range(rs, re);
      }
    }

    if (rb <= le) {
      if (rb > 0) {
        rf = new Range(Math.max(rb + 1, ls), le);
      } else if (rb == 0 && rs == 0) {
        rf = new Range(ls, le);
      }
    }

    if (le <= re || re == 0) {
      lb = le;
      l++;
    }
    if (re <= le || le == 0) {
      rb = re;
      r++;
    }

    if (lf && lf.count() > 0) {
      lfills.push(lf.move(-laggr));
      laggr += lf.count();
    }
    if (rf && rf.count() > 0) {
      rfills.push(rf.move(-raggr));
      raggr += rf.count();
    }
  }

  return [lfills, rfills];
}

export function uniqRanges(ranges) {
  const seen = {};
  const uniq = [];

  for (const range of ranges) {
    const { startLineNumber, startColumn, endLineNumber, endColumn } = range;
    const k = `(${startLineNumber}, ${startColumn}, ${endLineNumber}, ${endColumn})`;

    if (!seen[k]) {
      seen[k] = true;
      uniq.push(range);
    }
  }

  return uniq;
}

export function sortRanges(ranges) {
  return ranges.sort((a, b) => a.startLineNumber - b.startLineNumber);
}
