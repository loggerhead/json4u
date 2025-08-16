export type DiffType = "ins" | "del";

export interface DiffPair {
  left?: Diff;
  right?: Diff;
}

export interface Diff {
  offset: number; // Offset in the entire document.
  length: number; // Length of the difference.
  type: DiffType; // Type of the difference.
  range?: Range; // The range of the difference.
  inlineDiffs?: Diff[]; // Inline differences.
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

/**
 * Classifies an array of differences into left and right differences.
 * @param diffs - The array of differences.
 * @returns An object containing the left and right differences.
 */
export function classify(diffs: Diff[]): { left: Diff[]; right: Diff[] } {
  const left = sort(diffs.filter((d) => d.type === "del"));
  const right = sort(diffs.filter((d) => d.type === "ins"));
  return { left, right };
}

/**
 * Sorts an array of differences by type and offset.
 * @param diffs - The array of differences.
 * @returns The sorted array of differences.
 */
export function sort(diffs: Diff[]): Diff[] {
  return diffs.sort((a, b) => {
    if (a.type !== b.type) {
      return a.type === "del" ? -1 : 1;
    } else {
      return a.offset - b.offset;
    }
  });
}
