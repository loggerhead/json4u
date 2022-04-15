// copy from https://github.com/Swatinem/diff
export const DELETE = "del";
export const INSERT = "ins";
export const REPLACE = "rep";
export type DiffType = typeof DELETE | typeof INSERT | typeof REPLACE;

export const LEFT = "left";
export const RIGHT = "right";
export type Side = typeof LEFT | typeof RIGHT;

type EqFunction = (a: Array<any>, b: Array<any>) => boolean;
interface Snake {
  x: number;
  y: number;
  u: number;
  v: number;
}

export interface DiffResult {
  index: number;
  side: Side;
  diffType: DiffType;
}

export function diff(a: Array<any>, b: Array<any>, eql?: EqFunction): DiffResult[] {
  if (!eql) {
    eql = function (a: Array<any>, b: Array<any>): boolean {
      return a === b;
    };
  }

  let d = new Diff(a, b, eql);
  d.lcs(0, a.length, 0, b.length);
  return d.editscript();
}

class Diff {
  a: Array<any>;
  b: Array<any>;
  eql: EqFunction;
  moda: Array<boolean>;
  modb: Array<boolean>;
  // just to save some allocations:
  down: any;
  up: any;

  constructor(a: Array<any>, b: Array<any>, eql: EqFunction) {
    this.a = a;
    this.b = b;
    this.eql = eql;
    this.moda = Array.apply(null, new Array(a.length)).map(true.valueOf, false);
    this.modb = Array.apply(null, new Array(b.length)).map(true.valueOf, false);
    this.down = {};
    this.up = {};
  }

  editscript(): DiffResult[] {
    let moda = this.moda;
    let modb = this.modb;
    let astart = 0;
    let bstart = 0;
    let aend = moda.length;
    let bend = modb.length;
    let result: DiffResult[] = [];

    while (astart < aend || bstart < bend) {
      if (astart < aend && bstart < bend) {
        if (!moda[astart] && !modb[bstart]) {
          astart++;
          bstart++;
          continue;
        } else if (moda[astart] && modb[bstart]) {
          result.push({
            index: astart,
            side: LEFT,
            diffType: REPLACE,
          });
          result.push({
            index: bstart,
            side: RIGHT,
            diffType: REPLACE,
          });
          astart++;
          bstart++;
          continue;
        }
      }
      if (astart < aend && (bstart >= bend || moda[astart])) {
        result.push({
          index: astart,
          side: LEFT,
          diffType: DELETE,
        });
        astart++;
      }
      if (bstart < bend && (astart >= aend || modb[bstart])) {
        result.push({
          index: bstart,
          side: RIGHT,
          diffType: INSERT,
        });
        bstart++;
      }
    }

    return result;
  }

  lcs(astart: number, aend: number, bstart: number, bend: number) {
    let a = this.a;
    let b = this.b;
    let eql = this.eql;

    // separate common head
    while (astart < aend && bstart < bend && eql(a[astart], b[bstart])) {
      astart++;
      bstart++;
    }
    // separate common tail
    while (astart < aend && bstart < bend && eql(a[aend - 1], b[bend - 1])) {
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
    let eql = this.eql;
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

        while (x < aend && y < bend && eql(a[x], b[y])) {
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

        while (x > astart && y > bstart && eql(a[x - 1], b[y - 1])) {
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
