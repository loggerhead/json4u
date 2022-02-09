export default class MySet {
  vv: Map<string, null>;

  constructor() {
    this.vv = new Map();
  }

  has(v: string): boolean {
    return this.vv.has(v);
  }

  add(...vv: Array<string>) {
    for (const v of vv) {
      this.vv.set(v, null);
    }
  }

  del(...vv: Array<string>) {
    for (const v of vv) {
      this.vv.delete(v);
    }
  }

  size(): number {
    return this.vv.size;
  }

  forEach(fn: (v: string) => void) {
    for (const v of this.vv.keys()) {
      fn(v);
    }
  }

  static separate(a: MySet, b: MySet): MySet {
    let intersection = new MySet();

    if (a.size() > b.size()) {
      [a, b] = [b, a];
    }

    a.forEach((v) => {
      if (b.has(v)) {
        intersection.add(v);
        a.del(v);
        b.del(v);
      }
    });

    return intersection;
  }
}
