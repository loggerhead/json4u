// copy from https://github.com/Swatinem/diff
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

export interface Diff {
  index: number;
  diffType: DiffType;
  side?: Side;
}

export interface PartDiff {
  start: number;
  end: number;
  diffType: DiffType;
}

// char-by-char diff
export function partDiff(a: string, b: string): [PartDiff[], PartDiff[]] {
  const dd = myersDiff(a.split(""), b.split(""));
  let ll: PartDiff[] = [];
  let rr: PartDiff[] = [];

  for (const d of dd) {
    let t = d.diffType;
    if (t === INS) {
      t = PART_INS;
    } else if (t === DEL) {
      t = PART_DEL;
    }

    if (d.side === LEFT) {
      t = t === REP ? PART_DEL : t;
      ll.push({ start: d.index, end: d.index + 1, diffType: t });
    } else {
      t = t === REP ? PART_INS : t;
      rr.push({ start: d.index, end: d.index + 1, diffType: t });
    }
  }

  // 合并连续且相同的 diff
  const merge = function (pp: PartDiff[]): PartDiff[] {
    if (pp.length == 0) {
      return [];
    }

    let nn: PartDiff[] = [pp[0]];

    for (let i = 1; i < pp.length; i++) {
      const p = pp[i];
      let last = nn[nn.length - 1];

      if (last.diffType === p.diffType && last.end === p.start) {
        last.end = p.end;
      } else {
        nn.push(p);
      }
    }
    return nn;
  };

  return [merge(ll), merge(rr)];
}

export function myersDiff(a: string[], b: string[]): Diff[] {
  let d = new MyersDiff(a, b);
  d.lcs(0, a.length, 0, b.length);
  return d.editscript();
}

interface Snake {
  x: number;
  y: number;
  u: number;
  v: number;
}

class MyersDiff {
  a: string[];
  b: string[];
  moda: Array<boolean>;
  modb: Array<boolean>;
  // just to save some allocations:
  down: any;
  up: any;

  constructor(a: string[], b: string[]) {
    this.a = a;
    this.b = b;
    this.moda = Array.apply(null, new Array(a.length)).map(true.valueOf, false);
    this.modb = Array.apply(null, new Array(b.length)).map(true.valueOf, false);
    this.down = {};
    this.up = {};
  }

  editscript(): Diff[] {
    const self = this;
    let moda = this.moda;
    let modb = this.modb;
    let astart = 0;
    let bstart = 0;
    let aend = moda.length;
    let bend = modb.length;
    let result: Diff[] = [];

    const addDiff = function (index: number, side: Side, diffType: DiffType) {
      result.push({
        index: index,
        side: side,
        diffType: diffType,
      });
    };

    while (astart < aend || bstart < bend) {
      if (astart < aend && bstart < bend) {
        if (!moda[astart] && !modb[bstart]) {
          astart++;
          bstart++;
          continue;
        } else if (moda[astart] && modb[bstart]) {
          addDiff(astart, LEFT, REP);
          addDiff(bstart, RIGHT, REP);
          astart++;
          bstart++;
          continue;
        }
      }
      if (astart < aend && (bstart >= bend || moda[astart])) {
        addDiff(astart, LEFT, DEL);
        astart++;
      }
      if (bstart < bend && (astart >= aend || modb[bstart])) {
        addDiff(bstart, RIGHT, INS);
        bstart++;
      }
    }

    return result;
  }

  lcs(astart: number, aend: number, bstart: number, bend: number) {
    let a = this.a;
    let b = this.b;

    // separate common head
    while (astart < aend && bstart < bend && a[astart] === b[bstart]) {
      astart++;
      bstart++;
    }
    // separate common tail
    while (astart < aend && bstart < bend && a[aend - 1] === b[bend - 1]) {
      aend--;
      bend--;
    }

    if (astart === aend) {
      // only insertions
      while (bstart < bend) {
        this.modb[bstart] = true;
        bstart++;
      }
    } else if (bend === bstart) {
      // only deletions
      while (astart < aend) {
        this.moda[astart] = true;
        astart++;
      }
    } else {
      let snake = this.snake(astart, aend, bstart, bend);
      if (snake !== undefined) {
        this.lcs(astart, snake.x, bstart, snake.y);
        this.lcs(snake.u, aend, snake.v, bend);
      }
    }
  }

  snake(astart: number, aend: number, bstart: number, bend: number): Snake | undefined {
    let a = this.a;
    let b = this.b;
    let down = this.down;
    let up = this.up;

    let kdown = astart - bstart;
    let kup = aend - bend;
    let N = aend - astart;
    let M = bend - bstart;
    let delta = N - M;
    let deltaOdd = delta & 1;

    down[kdown + 1] = astart;
    up[kup - 1] = aend;

    let Dmax = (N + M + 1) / 2;

    for (let D = 0; D <= Dmax; D++) {
      let k, x, y;
      // forward path
      for (k = kdown - D; k <= kdown + D; k += 2) {
        if (k === kdown - D) {
          x = down[k + 1]; // down
        } else {
          x = down[k - 1] + 1; // right
          if (k < kdown + D && down[k + 1] >= x) {
            x = down[k + 1]; // down
          }
        }
        y = x - k;

        while (x < aend && y < bend && a[x] === b[y]) {
          x++;
          y++; // diagonal
        }
        down[k] = x;

        if (deltaOdd && kup - D < k && k < kup + D && up[k] <= down[k]) {
          return {
            x: down[k],
            y: down[k] - k,
            u: up[k],
            v: up[k] - k,
          };
        }
      }

      // reverse path
      for (k = kup - D; k <= kup + D; k += 2) {
        if (k === kup + D) {
          x = up[k - 1]; // up
        } else {
          x = up[k + 1] - 1; // left
          if (k > kup - D && up[k - 1] < x) {
            x = up[k - 1]; // up
          }
        }
        y = x - k;

        while (x > astart && y > bstart && a[x - 1] === b[y - 1]) {
          x--;
          y--; // diagonal
        }
        up[k] = x;

        if (!deltaOdd && kdown - D <= k && k <= kdown + D && up[k] <= down[k]) {
          return {
            x: down[k],
            y: down[k] - k,
            u: up[k],
            v: up[k] - k,
          };
        }
      }
    }

    return;
  }
}
