import * as jsonMap from "json-map-ts";
import jsonPointer from "json-pointer";

export const MORE = "more";
export const MISS = "miss";
export const UNEQ_TYPE = "uneq_type"; // different type
export const UNEQ_VAL = "uneq_val"; // same type, different val
export const UNEQ_KEY = "uneq_key"; // same value, different key
export type DiffType = typeof MORE | typeof MISS | typeof UNEQ_TYPE | typeof UNEQ_VAL | typeof UNEQ_KEY;

export interface Diff {
  line: number;
  pointer: string;
  diffType: DiffType;
}

export class TraceRecord {
  // current path of key
  path: Array<string>;
  // formated JSON for output
  out: string;
  data: any;
  pointers: jsonMap.Pointers;

  constructor(out: string) {
    this.out = out;
    this.path = [];
    this.pointers = {};
  }

  setParseResult(r: jsonMap.ParseResult) {
    this.data = r.data;
    this.pointers = r.pointers;
  }

  push(k: string | number) {
    this.path.push(k.toString());
  }

  pop() {
    this.path.pop();
  }

  getPointer(pointer: string): Record<jsonMap.PointerProp, jsonMap.Location> {
    return this.pointers[pointer];
  }

  getLine(pointer: string): number {
    return this.getPointer(pointer).key.line;
  }

  getKeyLinePos(pointer: string): number {
    return this.getPointer(pointer).key.linePos;
  }

  getValueLinePos(pointer: string): number {
    return this.getPointer(pointer).value.linePos;
  }

  getKeyPos(pointer: string): number {
    return this.getPointer(pointer).key.pos;
  }

  getValuePos(pointer: string): number {
    return this.getPointer(pointer).value.pos;
  }

  getKey(pointer: string): string {
    const p = this.getPointer(pointer);
    return this.out.slice(p.key.pos, p.keyEnd.pos);
  }

  getValue(pointer: string): string {
    const p = this.getPointer(pointer);
    return this.out.slice(p.value.pos, p.valueEnd.pos);
  }

  genDiff(diffType: any, key?: string | number, val?: any): Diff {
    let pointer;

    if (key === undefined) {
      pointer = jsonPointer.compile(this.path);
    } else {
      this.path.push(key.toString());
      pointer = jsonPointer.compile(this.path);
      this.path.pop();
    }

    return {
      line: this.getLine(pointer),
      pointer: pointer,
      diffType: diffType,
    };
  }
}
