import jsonPointer from "json-pointer";
import * as jsonMap from "json-map-ts";
import stringify from "json-stable-stringify";
import { isObject, isBaseType, isNumber } from "./typeHelper";
import TraceRecord from "./trace";
import MySet from "./set";
import { diff_match_patch, DIFF_DELETE, DIFF_INSERT, DIFF_EQUAL } from "./diff_match_patch.js";

export const NONE = "none"; // 不需要展示的 diff
export const REP = "replace"; // 需要处理成 INS、DEL 再展示的 diff
export const INS = "insert";
export const DEL = "delete";
export const PART_INS = "part_insert"; // inline character or word insert
export const PART_DEL = "part_delete"; // inline character or word delete
export type DiffType = typeof NONE | typeof REP | typeof INS | typeof DEL | typeof PART_INS | typeof PART_DEL;

export const LEFT = "left";
export const RIGHT = "right";
export type Side = typeof LEFT | typeof RIGHT;

export interface PartDiff {
  start: number;
  end: number;
  diffType: DiffType;
}

export interface Diff {
  index: number;
  diffType: DiffType;
  pointer: string;
  side?: Side;
  charDiffs?: PartDiff[];
}

export type DiffPair = [Diff | undefined, Diff | undefined];

export class Error {
  error: any;
  side: Side;

  constructor(e: any, side: Side) {
    this.error = e;
    this.side = side;
  }
}

export class Handler {
  results: DiffPair[];
  ltrace: TraceRecord;
  rtrace: TraceRecord;

  constructor(ltrace: TraceRecord, rtrace: TraceRecord) {
    this.results = [];
    this.ltrace = ltrace;
    this.rtrace = rtrace;
  }

  compare(): DiffPair[] {
    this.diffVal(this.ltrace.data, this.rtrace.data);
    this.results.sort((aa: DiffPair, bb: DiffPair): number => {
      const [al, ar] = aa;
      const [bl, br] = bb;
      const left = al === undefined || bl === undefined ? 0 : al.index - bl.index;
      const right = ar === undefined || br === undefined ? 0 : ar.index - br.index;
      return right ? right : left;
    });
    return this.results;
  }

  genAndSetCharsDiff(ldiff: Diff, rdiff: Diff, isKey?: boolean) {
    let [lpos, rpos, ltext, rtext] = isKey
      ? [
          this.ltrace.getKeyPos(ldiff.pointer) - this.ltrace.getKeyLinePos(ldiff.pointer),
          this.rtrace.getKeyPos(rdiff.pointer) - this.rtrace.getKeyLinePos(rdiff.pointer),
          this.ltrace.getKey(ldiff.pointer),
          this.rtrace.getKey(rdiff.pointer),
        ]
      : [
          this.ltrace.getValuePos(ldiff.pointer) - this.ltrace.getValueLinePos(ldiff.pointer),
          this.rtrace.getValuePos(rdiff.pointer) - this.rtrace.getValueLinePos(rdiff.pointer),
          this.ltrace.getValue(ldiff.pointer),
          this.rtrace.getValue(rdiff.pointer),
        ];

    [ldiff.charDiffs, rdiff.charDiffs] = charDiff(lpos, rpos, ltext, rtext, false);
  }

  diffVal(ldata: any, rdata: any) {
    if (Array.isArray(ldata) && Array.isArray(rdata)) {
      this.diffArray(ldata, rdata);
    } else if (isObject(ldata) && isObject(rdata)) {
      this.diffObject(ldata, rdata);
    } else if (ldata !== rdata) {
      let ldiff = genDiff(this.ltrace, DEL);
      let rdiff = genDiff(this.rtrace, INS);

      if (isNeedDiffVal(ldata, rdata)) {
        this.genAndSetCharsDiff(ldiff, rdiff);
      }

      this.results.push([ldiff, rdiff]);
    }
  }

  diffArray(ldata: Array<any>, rdata: Array<any>) {
    const [ldt, rdt] = myerDiffArray(ldata, rdata);
    let l = 0;
    let r = 0;

    while (l < ldata.length && r < rdata.length) {
      const lt = ldt[l];
      const rt = rdt[r];

      if (lt === NONE) {
        l++;
        continue;
      } else if (rt === NONE) {
        r++;
        continue;
      }

      if (l === r) {
        this.ltrace.push(l);
        this.rtrace.push(r);
        this.diffVal(ldata[l], rdata[r]);
        this.ltrace.pop();
        this.rtrace.pop();
        l++;
        r++;
      } else if (lt === DEL) {
        this.results.push([genDiff(this.ltrace, DEL, l), genDiff(this.rtrace, NONE)]);
        l++;
      } else if (rt === INS) {
        this.results.push([genDiff(this.ltrace, NONE), genDiff(this.rtrace, INS, r)]);
        r++;
      }
    }

    for (; l < ldata.length; l++) {
      if (ldt[l] !== NONE) {
        this.results.push([genDiff(this.ltrace, DEL, l), genDiff(this.rtrace, NONE)]);
      }
    }

    for (; r < rdata.length; r++) {
      if (rdt[r] !== NONE) {
        this.results.push([genDiff(this.ltrace, NONE), genDiff(this.rtrace, INS, r)]);
      }
    }
  }

  diffObject(ldata: any, rdata: any) {
    const [common, leftOnly, rightOnly] = splitKeys(ldata, rdata);

    // iterate over same keys
    common.forEach((k) => {
      this.ltrace.push(k);
      this.rtrace.push(k);
      this.diffVal(ldata[k], rdata[k]);
      this.ltrace.pop();
      this.rtrace.pop();
    });

    const seen = new MySet();

    // iterate over keys which need char compare keys
    leftOnly.forEach((lkey) => {
      rightOnly.forEach((rkey) => {
        if (seen.has(rkey) || !isNeedDiffKey(ldata, rdata, lkey, rkey)) {
          return;
        }

        let ldiff = genDiff(this.ltrace, DEL, lkey);
        let rdiff = genDiff(this.rtrace, INS, rkey);
        this.genAndSetCharsDiff(ldiff, rdiff, true);
        this.results.push([ldiff, rdiff]);
        seen.add(lkey);
        seen.add(rkey);
      });
    });

    leftOnly.forEach((key) => {
      if (seen.has(key)) {
        return;
      }
      this.results.push([genDiff(this.ltrace, DEL, key), genDiff(this.rtrace, NONE)]);
    });

    rightOnly.forEach((key) => {
      if (seen.has(key)) {
        return;
      }
      this.results.push([genDiff(this.ltrace, NONE), genDiff(this.rtrace, INS, key)]);
    });
  }
}

export function compare(ltext: string, rtext: string): DiffPair[] | Error {
  let ltrace = new TraceRecord(ltext);
  let rtrace = new TraceRecord(rtext);

  try {
    ltrace.setParseResult(jsonMap.parse(ltrace.out));
  } catch (e: any) {
    return new Error(e, LEFT);
  }

  try {
    rtrace.setParseResult(jsonMap.parse(rtrace.out));
  } catch (e: any) {
    return new Error(e, RIGHT);
  }

  return new Handler(ltrace, rtrace).compare();
}

export function textCompare(ltext: string, rtext: string, ignoreBlank: boolean): DiffPair[] {
  let llines = ltext.split("\n");
  let rlines = rtext.split("\n");

  // 将文本比较结果转成行比较结果，段 -> 行
  const partDiffs2diffPairs = function (partDiffs: PartDiff[], text: string, side: Side): Diff[] {
    // 行起始位置
    let start = 0;
    // 行结束位置
    let end = 0;
    let lines = side === LEFT ? llines : rlines;
    let results: Diff[] = [];

    for (let i = 0; i < lines.length; i++, start = end + 1) {
      const line = lines[i];
      end = start + line.length;

      // 过滤出归属本行的文本比较结果
      const dd = partDiffs.filter((d) => d.start < end && start < d.end);
      const charDiffs = dd.map((d) => ({
        start: Math.max(d.start, start) - start,
        end: Math.min(d.end, end) - start,
        diffType: d.diffType,
      }));

      if (charDiffs.length == 0) {
        continue;
      }

      results.push({
        index: i + 1,
        diffType: side === LEFT ? DEL : INS,
        side: side,
        pointer: "",
        charDiffs: charDiffs,
      });
    }

    return results;
  };

  // 进行文本比较
  let [lpartDiffs, rpartDiffs] = charDiff(0, 0, ltext, rtext, ignoreBlank);
  let ldiffs = partDiffs2diffPairs(lpartDiffs, ltext, LEFT);
  let rdiffs = partDiffs2diffPairs(rpartDiffs, rtext, RIGHT);

  let results: DiffPair[] = [];

  // 如果一段的行高亮和 char-by-char 高亮是重复的，去除 char-by-char 高亮
  const cleanupHighlight = function (diffs: Diff[], side: Side) {
    // 一段的起始下标
    let prev = 0;

    for (let i = 0; i < diffs.length; i++) {
      const diff1 = diffs[i];
      const diff2 = diffs[i + 1];

      // 如果两个连续的 diff 位于一段
      if (diff2 && diff1.index + 1 === diff2.index) {
        continue;
      }

      let needCleanup = true;

      // 检查是否需要清理本段的 char-by-char 高亮
      for (let j = prev; j <= i; j++) {
        const diff = diffs[j];
        const line = (side === LEFT ? llines : rlines)[diff.index - 1];

        const charDiffs = diff.charDiffs?.filter((d) => {
          if (ignoreBlank) {
            const charDiff = line.slice(d.start, d.end);
            return !ignoreBlankEqual(charDiff, line);
          } else {
            return d.end - d.start < line.length;
          }
        });

        if (charDiffs && charDiffs.length > 0) {
          needCleanup = false;
          break;
        }
      }

      if (needCleanup) {
        for (let j = prev; j <= i; j++) {
          diffs[j].charDiffs = [];
        }
      }

      prev = i + 1;
    }
  };

  cleanupHighlight(ldiffs, LEFT);
  cleanupHighlight(rdiffs, RIGHT);

  for (const diff of ldiffs) {
    results.push([diff, undefined]);
  }
  for (const diff of rdiffs) {
    results.push([undefined, diff]);
  }

  return results;
}

function charDiff(
  lpos: number,
  rpos: number,
  ltext: string,
  rtext: string,
  ignoreBlank: boolean
): [PartDiff[], PartDiff[]] {
  let dmp = new diff_match_patch();
  let dd = dmp.diff_main(ltext, rtext);
  dmp.diff_cleanupSemantic(dd);
  dd = dd.filter((d) => d[1].length > 0);

  let lpartDiffs: PartDiff[] = [];
  let rpartDiffs: PartDiff[] = [];

  for (let i = 0; i < dd.length; i++) {
    // diff type
    const t = dd[i][0];
    // text length
    const n = dd[i][1].length;

    // equal
    if (t === DIFF_EQUAL) {
      lpos += n;
      rpos += n;
      // delete from left side
    } else if (t === DIFF_DELETE) {
      // 如果去除首尾空格，与 INSERT 部分的文本相等，说明没有空白字符以外的变化
      const skipBlankDiff = ignoreBlank && i < dd.length - 1 && ignoreBlankEqual(dd[i][1], dd[i + 1][1]);

      if (!skipBlankDiff) {
        lpartDiffs.push({
          start: lpos,
          end: lpos + n,
          diffType: PART_DEL,
        });
      }

      lpos += n;
      // insert to right side
    } else if (t === DIFF_INSERT) {
      // 如果去除首尾空格，与 DELETE 部分的文本相等，说明没有空白字符以外的变化
      const skipBlankDiff = ignoreBlank && i > 0 && ignoreBlankEqual(dd[i][1], dd[i - 1][1]);

      if (!skipBlankDiff) {
        rpartDiffs.push({
          start: rpos,
          end: rpos + n,
          diffType: PART_INS,
        });
      }

      rpos += n;
    }
  }

  return [lpartDiffs, rpartDiffs];
}

function myerDiffArray(ldata: Array<any>, rdata: Array<any>): [Array<DiffType>, Array<DiffType>] {
  const llines = ldata.map((o) => stringify4diff(o));
  const rlines = rdata.map((o) => stringify4diff(o));

  let lineArray = [""];
  let lineHash: any = {};
  let n = lineArray.length;

  // 将 array 映射成 unicode 字符串，然后进行 text compare
  function lines2chars(lines: string[]): string {
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
  }

  const lchars = lines2chars(llines);
  const rchars = lines2chars(rlines);
  let dmp = new diff_match_patch();
  let diffs = dmp.diff_main(lchars, rchars, false);

  let ldt: Array<DiffType> = [];
  let rdt: Array<DiffType> = [];

  for (let i = 0; i < diffs.length; i++) {
    const t = diffs[i][0];

    for (let j = 0; j < diffs[i][1].length; j++) {
      if (t === DIFF_EQUAL) {
        ldt.push(NONE);
        rdt.push(NONE);
      } else if (t === DIFF_DELETE) {
        ldt.push(DEL);
      } else if (t === DIFF_INSERT) {
        rdt.push(INS);
      }
    }
  }

  return [ldt, rdt];
}

function genDiff(trace: TraceRecord, diffType: DiffType, key?: string | number, val?: any): Diff {
  let pointer;

  if (key === undefined) {
    pointer = jsonPointer.compile(trace.path);
  } else {
    trace.path.push(key.toString());
    pointer = jsonPointer.compile(trace.path);
    trace.path.pop();
  }

  return {
    index: trace.getLine(pointer),
    pointer: pointer,
    diffType: diffType,
    charDiffs: [],
  };
}

function splitKeys(ldata: Object, rdata: Object): [MySet, MySet, MySet] {
  let leftOnly = new MySet();
  let rightOnly = new MySet();
  leftOnly.add(...Object.keys(ldata));
  rightOnly.add(...Object.keys(rdata));
  const intersection = MySet.separate(leftOnly, rightOnly);
  return [intersection, leftOnly, rightOnly];
}

function isNeedDiffKey(ldata: any, rdata: any, lkey: string, rkey: string): boolean {
  const val1 = ldata[lkey];
  const val2 = rdata[rkey];

  if (val1 === undefined || val2 === undefined) {
    return false;
  } else if (typeof val1 !== typeof val2) {
    return false;
  } else if (isBaseType(val1) && val1 === val2) {
    return true;
  }

  return stringify4diff(val1) === stringify4diff(val2);
}

function isNeedDiffVal(a: any, b: any): boolean {
  if (isNumber(a) && isNumber(b)) {
    return true;
  } else if (typeof a !== typeof b) {
    return false;
  }

  return isObject(a) === isObject(b);
}

function ignoreBlankEqual(a: string, b: string): boolean {
  return a.replaceAll(/\s/g, "") === b.replaceAll(/\s/g, "");
}

// WARNING: bigint 末尾会加 n，string 类型末尾会加 s
function stringify4diff(o: any): string {
  return stringify(o, {
    replacer: (key: any, value: any) => {
      if (typeof value === "bigint") {
        return value.toString() + "n";
      } else if (typeof value === "string") {
        return value + "s";
      } else {
        return value;
      }
    },
  });
}
