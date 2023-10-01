import {myersDiff} from "./myers";
import {classify, DEL, HunkDiff, INS} from "./diff";

// copy from https://github.com/octavore/delta/blob/master/lib/histogram.go
/** HistogramDiff uses the histogram diff algorithm to generate a line-based diff between two strings
 * 语义化比较文本的差异。如果不能语义化比较，则降级成文本比较
 *
 * @param {string} a - 左侧文本
 * @param {string} b - 右侧文本
 * @returns {[HunkDiff]} 差异
 */
export function histogramDiff(a, b) {
  if (a.length + b.length === 0) {
    return [];
  } else if (a.length === 0) {
    return [new HunkDiff(0, b.length, INS)];
  } else if (b.length === 0) {
    return [new HunkDiff(0, a.length, DEL)];
  }

  const aa = a.split("\n");
  const bb = b.split("\n");
  return new HistogramDiffer(aa, bb).solve();
}

// matchRegion delineates a region of A and B which are equal.
// start is inclusive but end is exclusive
class MatchRegion {
  constructor(aStart, aEnd, bStart, bEnd, matchScore = 0) {
    this.aStart = aStart;
    this.aEnd = aEnd;
    this.bStart = bStart;
    this.bEnd = bEnd;
    this.matchScore = matchScore;
  }

  validStart(aStart, bStart) {
    return aStart < this.aStart && bStart < this.bStart;
  }

  validEnd(aEnd, bEnd) {
    return this.aEnd < aEnd && this.bEnd < bEnd;
  }

  length() {
    return this.aEnd - this.aStart;
  }
}

// 统计图
class Histogram {
  constructor() {
    this.lines = new Map();
  }

  static fromLines(array, start, end) {
    const histogram = new Histogram();
    for (let i = start; i < end; i++) {
      histogram.add(array[i], i);
    }
    return histogram;
  }

  add(line, index) {
    line = trimLine(line);
    if (!this.lines.has(line)) {
      this.lines.set(line, []);
    }
    this.lines.get(line).push(index);
  }

  get(line) {
    line = trimLine(line);
    return this.lines.get(line) || [];
  }

  num(line) {
    line = trimLine(line);
    return this.get(line).length;
  }

  first(line) {
    line = trimLine(line);
    return this.get(line)[0];
  }

  delFirst(line) {
    line = trimLine(line);
    this.lines.set(line, this.get(line).splice(1));
  }
}

// HistogramDiffer implements the histogram diff algorithm.
class HistogramDiffer {
  /**
   * @param {[string]} aa - 左侧行数组
   * @param {[string]} bb - 右侧行数组
   */
  constructor(aa, bb) {
    this.aa = aa;
    this.bb = bb;
  }

  eq(aIdx, bIdx) {
    return trimLine(this.aa[aIdx]) === trimLine(this.bb[bIdx]);
  }

  /** longestSubstring finds the longest matching region in the given area of the inputs A and B.
   * @param {int} aStart - 左侧文本起始行
   * @param {int} aEnd - 左侧文本结束行
   * @param {int} bStart - 右侧文本起始行
   * @param {int} bEnd - 右侧文本结束行
   * @returns {MatchRegion} 匹配的区域
   */
  longestSubstring(aStart, aEnd, bStart, bEnd) {
    let bestMatch = null;
    let bestMatchScore = aEnd - aStart;
    let histogram = Histogram.fromLines(this.aa, aStart, aEnd);

    for (let bIdx = bStart; bIdx < bEnd;) {
      let nextB = bIdx + 1;
      let lineB = trimLine(this.bb[bIdx]);

      // only consider low-occurence elements
      if (histogram.num(lineB) > bestMatchScore) {
        bIdx = nextB;
        continue;
      }

      // for all matching lines in A, find the longest substring
      // implict: if _, ok = histogram[lineB]; !ok { continue }
      let prevA = aStart;
      for (const as of histogram.get(lineB)) {
        // skip if the region was in the last match
        if (as < prevA) {
          continue;
        }

        // we start off with the minimal matching region and then expand the match region.
        let r = new MatchRegion(as, as + 1, bIdx, bIdx + 1, aEnd - aStart);

        // expand beginning of match region
        while (r.validStart(aStart, bStart) && this.eq(r.aStart - 1, r.bStart - 1)) {
          r.aStart--;
          r.bStart--;
          if (r.matchScore > 1) {
            const trimmedAStart = trimLine(this.aa[r.aStart]);
            r.matchScore = Math.min(r.matchScore, histogram.num(trimmedAStart));
          }
        }

        // expand end of match region
        while (r.validEnd(aEnd, bEnd) && this.eq(r.aEnd, r.bEnd)) {
          if (r.matchScore > 1) {
            const trimmedAEnd = trimLine(this.aa[r.aEnd]);
            r.matchScore = Math.min(r.matchScore, histogram.num(trimmedAEnd));
          }
          r.aEnd++;
          r.bEnd++;
        }

        // see if we have a good match
        if (bestMatch?.length() < r.length() || r.matchScore < bestMatchScore) {
          bestMatch = r;
          bestMatchScore = r.matchScore;
        }

        // update cursors to skip regions we've already matched
        if (nextB < r.bEnd) {
          nextB = r.bEnd;
        }

        prevA = r.aEnd;
      }

      bIdx = nextB;
    }

    return bestMatch;
  }

  /** solveRange finds the set of matching regions for the given sections of A and B.
   * First the longest matching region is found, then we recurse on the area before the match,
   * and then on the area after the match.
   *
   * @param {int} aStart - 左侧文本起始行
   * @param {int} aEnd - 左侧文本结束行
   * @param {int} bStart - 右侧文本起始行
   * @param {int} bEnd - 右侧文本结束行
   * @returns {[MatchRegion]} 匹配的区域
   */
  solveRange(aStart, aEnd, bStart, bEnd) {
    if (bEnd - bStart <= 1) {
      return [];
    }
    if (aEnd - aStart <= 1) {
      return [];
    }

    const region = this.longestSubstring(aStart, aEnd, bStart, bEnd);
    if (region == null) {
      return [];
    }

    return [
      ...this.solveRange(aStart, region.aStart, bStart, region.bStart),
      region,
      ...this.solveRange(region.aEnd, aEnd, region.bEnd, bEnd),
    ];
  }

  findCommonLines(aa, bb) {
    const histogram = Histogram.fromLines(aa, 0, aa.length);
    const regions = [];

    for (let bI = 0; bI < bb.length; bI++) {
      const line = bb[bI];
      const aI = histogram.first(line);

      if (aI !== undefined) {
        regions.push(new MatchRegion(aI, aI + 1, bI, bI + 1));
        histogram.delFirst(line);
      }
    }

    return regions;
  }

  fineSolveRegion(regions) {
    let res = [];
    let prevRegion = null;

    for (let i = 0; i <= regions.length; i++) {
      const region = regions[i];
      const aOffset = prevRegion?.aEnd || 0;
      const bOffset = prevRegion?.bEnd || 0;
      const aa = this.aa.slice(aOffset, region ? region.aStart : this.aa.length);
      const bb = this.bb.slice(bOffset, region ? region.bStart : this.bb.length);

      if (prevRegion) {
        res.push(prevRegion);
      }
      prevRegion = region;

      if (aa.length > 0 && bb.length > 0 && (aa.length + bb.length) > 2) {
        this.findCommonLines(aa, bb).forEach((r) => {
          r.aStart += aOffset;
          r.aEnd += aOffset;
          r.bStart += bOffset;
          r.bEnd += bOffset;
          res.push(r);
        });
      }
    }

    return res;
  }

  /** Solve returns a DiffSolution. Internally it uses solveRange to find all matching regions,
   * then it uses the standard differ to create diffs on the intra-region area.
   *
   * @returns {[HunkDiff]} 差异
   */
  solve() {
    let res = [];
    let apos = 0;
    let bpos = 0;
    let prevRegion = new MatchRegion(0, 0, 0, 0, 0);
    // 找到公共行
    let regions = this.solveRange(0, this.aa.length, 0, this.bb.length);
    regions = this.fineSolveRegion(regions);

    const joinLines = (lines, start, end) => {
      if (start >= end) {
        return '';
      }

      const s = lines.slice(start, end).join("\n");
      return s + "\n";
    };

    const lineLen = (line) => {
      return line === '' ? 0 : Math.max(1, line.length - 1);
    };

    // 计算块差异
    for (let i = 0; i <= regions.length; i++) {
      const region = regions[i];
      const aEnd = region ? region.aStart : this.aa.length;
      const bEnd = region ? region.bStart : this.bb.length;
      const aaStr = joinLines(this.aa, prevRegion.aEnd, aEnd);
      const bbStr = joinLines(this.bb, prevRegion.bEnd, bEnd);
      const aDiff = new HunkDiff(apos, lineLen(aaStr), DEL);
      const bDiff = new HunkDiff(bpos, lineLen(bbStr), INS);

      if (aDiff.length > 0) {
        res.push(aDiff);
      }
      if (bDiff.length > 0) {
        res.push(bDiff);
      }

      // 去除首尾空白字符后进行行内比较
      if (aaStr.length > 0 && bbStr.length > 0) {
        [aDiff.inlineDiffs, bDiff.inlineDiffs] = classify(myersDiff(aaStr, bbStr));
        aDiff.inlineDiffs.forEach((d) => d.offset += aDiff.offset);
        bDiff.inlineDiffs.forEach((d) => d.offset += bDiff.offset);
      }

      if (region) {
        // 相等部分。因为进行了 trim，所以相等部分的长度需要分别计算
        const aaComm = joinLines(this.aa, region.aStart, region.aEnd);
        const bbComm = joinLines(this.bb, region.bStart, region.bEnd);
        apos += aaStr.length + aaComm.length;
        bpos += bbStr.length + bbComm.length;
        prevRegion = region;
      }
    }

    return res;
  }
}

function trimLine(line) {
  return line.trim();
}