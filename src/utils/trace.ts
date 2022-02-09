import * as jsonMap from "json-map-ts";

export default class TraceRecord {
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
    const p = this.getPointer(pointer);
    return p.key === undefined ? p.value.line : p.key.line;
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
}
