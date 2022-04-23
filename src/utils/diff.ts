import jsonPointer from "json-pointer";
import * as jsonMap from "json-map-ts";
import { deepEqual } from "fast-equals";
import { OptionNum, isObject, isBaseType, isNumber } from "./typeHelper";
import TraceRecord from "./trace";
import MySet from "./set";
import {
  DiffType,
  Diff as BaseDiff,
  PartDiff,
  Side,
  REP,
  DEL,
  INS,
  PART_INS,
  PART_DEL,
  LEFT,
  RIGHT,
  NONE,
  myersDiff,
  partDiff,
} from "./myersDiff";

export type { DiffType, Side };
export { NONE, DEL, INS, PART_INS, PART_DEL, LEFT, RIGHT };

export interface Diff extends BaseDiff {
  pointer: string;
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

    [ldiff.charDiffs, rdiff.charDiffs] = charDiff(lpos, rpos, ltext, rtext);
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
        this.results.push([genDiff(this.ltrace, NONE), genDiff(this.rtrace, INS, i)]);
      } else if (ldata.length > rdata.length) {
        this.results.push([genDiff(this.ltrace, INS, i), genDiff(this.rtrace, NONE)]);
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
      this.results.push([genDiff(this.ltrace, INS, key), genDiff(this.rtrace, NONE)]);
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
  const llines = ltext.split("\n");
  const rlines = rtext.split("\n");
  const dd = myersDiff(llines, rlines);

  const genDiffs = function (lIndex: OptionNum, rIndex: OptionNum, lDiffType: DiffType, rDiffType: DiffType): DiffPair {
    return [
      lIndex === undefined
        ? undefined
        : {
            index: Math.min(lIndex, llines.length - 1) + 1,
            diffType: lDiffType,
            pointer: "",
          },
      rIndex === undefined
        ? undefined
        : {
            index: Math.min(rIndex, rlines.length - 1) + 1,
            diffType: rDiffType,
            pointer: "",
          },
    ];
  };

  let results: DiffPair[] = [];

  for (let i = 0; i < dd.length; i++) {
    const d = dd[i];
    const diffType = d.diffType;
    const side = d.side;

    // 忽略空白差异
    if (ignoreBlank && isBlank((side == LEFT ? llines : rlines)[d.index])) {
      continue;
    }

    if (diffType === DEL) {
      if (side == LEFT) {
        results.push(genDiffs(d.index, undefined, DEL, NONE));
      } else {
        results.push(genDiffs(undefined, d.index, NONE, DEL));
      }
    } else if (diffType === INS) {
      if (side == LEFT) {
        results.push(genDiffs(d.index, undefined, INS, NONE));
      } else {
        results.push(genDiffs(undefined, d.index, NONE, INS));
      }
    } else if (diffType === REP) {
      const rd = dd[++i];
      // char-by-char diff
      let [lcharDiffs, rcharDiffs] = charDiff(0, 0, llines[d.index], rlines[rd.index]);

      // 忽略空白差异
      if (ignoreBlank) {
        lcharDiffs = lcharDiffs.filter((cd) => !isBlank(llines[d.index].slice(cd.start, cd.end)));
        rcharDiffs = rcharDiffs.filter((cd) => !isBlank(rlines[rd.index].slice(cd.start, cd.end)));
        if (lcharDiffs.length + rcharDiffs.length == 0) {
          continue;
        }
      }

      let [ldiff, rdiff] = genDiffs(d.index, d.index, DEL, INS);
      (ldiff as Diff).charDiffs = lcharDiffs;
      (rdiff as Diff).charDiffs = rcharDiffs;
      // 如果不存在 char-by-char diff 结果，说明有一边是 insert 或 delete，而另一边相对而言没有改变
      results.push([ldiff?.charDiffs ? ldiff : undefined, rdiff?.charDiffs ? rdiff : undefined]);
    }
  }

  return results;
}

function isBlank(s: string): boolean {
  return s.trim().length == 0;
}

function charDiff(lpos: number, rpos: number, ltext: string, rtext: string): [PartDiff[], PartDiff[]] {
  let [lcharDiffs, rcharDiffs] = partDiff(ltext, rtext);

  for (let d of lcharDiffs) {
    d.start += lpos;
    d.end += lpos;
  }

  for (let d of rcharDiffs) {
    d.start += rpos;
    d.end += rpos;
  }

  return [lcharDiffs, rcharDiffs];
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
