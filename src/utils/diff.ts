import jsonPointer from "json-pointer";
import diff from "fast-diff";
import * as jsonMap from "json-map-ts";
import { deepEqual } from "fast-equals";
import { OptionNum, isObject, isBaseType, isNumber } from "./typeHelper";
import TraceRecord from "./trace";
import MySet from "./set";
import * as MyersDiff from "./myersDiff";

export const NONE = "none"; // 不需要展示的 diff
export const MORE = "more";
export const LESS = "less";
export const CHAR_INS = "char_insert"; // inline character insert
export const CHAR_DEL = "char_delete"; // inline character delete
export type DiffType = typeof NONE | typeof MORE | typeof LESS | typeof CHAR_INS | typeof CHAR_DEL;

export const LEFT = "left";
export const RIGHT = "right";
export type Side = typeof LEFT | typeof RIGHT;

interface CharDiff {
  start: number;
  end: number;
  diffType: DiffType;
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

export interface Diff {
  line: number;
  diffType: DiffType;
  pointer: string;
  charDiffs?: CharDiff[];
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
      const left = al === undefined || bl === undefined ? 0 : al.line - bl.line;
      const right = ar === undefined || br === undefined ? 0 : ar.line - br.line;
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

    let cdiffs = diff(ltext, rtext);

    for (const cdiff of cdiffs) {
      const [t, v] = cdiff;

      if (t == diff.INSERT) {
        rdiff.charDiffs?.push({ start: rpos, end: rpos + v.length, diffType: CHAR_INS });
        rpos += v.length;
      } else if (t == diff.DELETE) {
        ldiff.charDiffs?.push({ start: lpos, end: lpos + v.length, diffType: CHAR_DEL });
        lpos += v.length;
      } else {
        lpos += v.length;
        rpos += v.length;
      }
    }
  }

  diffVal(ldata: any, rdata: any) {
    if (Array.isArray(ldata) && Array.isArray(rdata)) {
      this.diffArray(ldata, rdata);
    } else if (isObject(ldata) && isObject(rdata)) {
      this.diffObject(ldata, rdata);
    } else if (ldata !== rdata) {
      let ldiff = genDiff(this.ltrace, LESS);
      let rdiff = genDiff(this.rtrace, MORE);

      if (isNeedDiffVal(ldata, rdata)) {
        this.genAndSetCharsDiff(ldiff, rdiff);
      }

      this.results.push([ldiff, rdiff]);
    }
  }

  diffArray(ldata: Array<any>, rdata: Array<any>) {
    const union = Math.max(ldata.length, rdata.length);
    const subset = Math.min(ldata.length, rdata.length);

    for (let i = 0; i < union; i++) {
      if (i < subset) {
        this.ltrace.push(i);
        this.rtrace.push(i);
        this.diffVal(ldata[i], rdata[i]);
        this.ltrace.pop();
        this.rtrace.pop();
      } else if (ldata.length < rdata.length) {
        this.results.push([genDiff(this.ltrace, NONE), genDiff(this.rtrace, MORE, i)]);
      } else if (ldata.length > rdata.length) {
        this.results.push([genDiff(this.ltrace, MORE, i), genDiff(this.rtrace, NONE)]);
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

        let ldiff = genDiff(this.ltrace, LESS, lkey);
        let rdiff = genDiff(this.rtrace, MORE, rkey);
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
      this.results.push([genDiff(this.ltrace, MORE, key), genDiff(this.rtrace, NONE)]);
    });

    rightOnly.forEach((key) => {
      if (seen.has(key)) {
        return;
      }
      this.results.push([genDiff(this.ltrace, NONE), genDiff(this.rtrace, MORE, key)]);
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

export function textCompare(ltext: string, rtext: string): DiffPair[] {
  const llines = ltext.split("\n");
  const rlines = rtext.split("\n");
  const dd = MyersDiff.diff(llines, rlines);

  const genDiffs = function (lIndex: OptionNum, rIndex: OptionNum, lDiffType: DiffType, rDiffType: DiffType): DiffPair {
    return [
      lIndex === undefined
        ? undefined
        : {
            line: Math.min(lIndex, llines.length - 1),
            diffType: lDiffType,
            pointer: "",
          },
      rIndex === undefined
        ? undefined
        : {
            line: Math.min(rIndex, rlines.length - 1),
            diffType: rDiffType,
            pointer: "",
          },
    ];
  };

  let results: DiffPair[] = [];

  for (const d of dd) {
    const i = d.index + 1;
    const t = d.diffType;
    const side = d.side;

    if (t === MyersDiff.DELETE) {
      if (side == LEFT) {
        results.push(genDiffs(i, undefined, LESS, NONE));
      } else {
        results.push(genDiffs(undefined, i, NONE, LESS));
      }
    } else if (t === MyersDiff.INSERT) {
      if (side == LEFT) {
        results.push(genDiffs(i, undefined, MORE, NONE));
      } else {
        results.push(genDiffs(undefined, i, NONE, MORE));
      }
    } else if (t === MyersDiff.REPLACE) {
      if (side == LEFT) {
        results.push(genDiffs(i, undefined, LESS, NONE));
      } else {
        results.push(genDiffs(undefined, i, NONE, MORE));
      }
    }
  }

  return results;
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
    line: trace.getLine(pointer),
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

  return deepEqual(val1, val2);
}

function isNeedDiffVal(a: any, b: any): boolean {
  if (isNumber(a) && isNumber(b)) {
    return true;
  } else if (typeof a !== typeof b) {
    return false;
  }

  return isObject(a) === isObject(b);
}
