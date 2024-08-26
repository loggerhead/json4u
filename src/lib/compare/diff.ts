export type DiffType = "ins" | "del";

export interface DiffPair {
  left?: Diff;
  right?: Diff;
}

export interface Diff {
  offset: number; // 整个文档中的偏移量
  length: number; // 差异部分的长度
  type: DiffType; // 差异类型
  range?: Range; // 差异区域
  inlineDiffs?: Diff[]; // 行内差异
}

export interface Range {
  startLineNumber: number;
  endLineNumber: number;
  startColumn: number;
  endColumn: number;
  offset: number;
  length: number;
}

export function newRange(
  startLineNumber: number,
  endLineNumber: number,
  startColumn: number = 1,
  endColumn: number = 1,
) {
  return {
    startLineNumber,
    endLineNumber,
    startColumn,
    endColumn,
    offset: 0,
    length: 0,
  };
}

export function newDiff(offset: number, length: number, type: DiffType): Diff {
  return { offset, length, type };
}

export function classify(diffs: Diff[]): { left: Diff[]; right: Diff[] } {
  const left = sort(diffs.filter((d) => d.type === "del"));
  const right = sort(diffs.filter((d) => d.type === "ins"));
  return { left, right };
}

export function sort(diffs: Diff[]): Diff[] {
  return diffs.sort((a, b) => {
    if (a.type !== b.type) {
      return a.type === "del" ? -1 : 1;
    } else {
      return a.offset - b.offset;
    }
  });
}
