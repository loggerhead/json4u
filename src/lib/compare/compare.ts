import { getChildrenKeys, getRawValue, Node, Tree } from "@/lib/parser";
import { classify, type Diff, type DiffPair, DiffType, newDiff } from "./diff";
import { histogramDiff } from "./histogram";
import { arrayDiff, MaxEditLength, myersDiff } from "./myers";

/**
 * Compares two JSON trees and returns an array of difference pairs.
 * @param ltree - The left JSON tree.
 * @param rtree - The right JSON tree.
 * @returns An array of difference pairs.
 */
export function compareJSON(ltree: Tree, rtree: Tree): DiffPair[] {
  const Diff = (node: Node, type: DiffType, includeBound: boolean = true) => {
    return includeBound ? newDiff(node.boundOffset, node.boundLength, type) : newDiff(node.offset, node.length, type);
  };

  // Converts inline diffs to global diffs.
  const newInlineDiffs = (node: Node, inlineDiffs: Diff[]) =>
    inlineDiffs.map((d) => {
      d.offset += node.offset;
      return d;
    });

  const pairs: DiffPair[] = [];

  const comparer = {
    // Compares two nodes.
    diff(lnode: Node, rnode: Node) {
      if (lnode.type !== rnode.type) {
        pairs.push({
          left: Diff(lnode, "del", false),
          right: Diff(rnode, "ins", false),
        });
        return;
      }

      if (lnode.type === "array") {
        this.diffArray(lnode, rnode);
      } else if (lnode.type === "object") {
        this.diffObject(lnode, rnode);
      } else if (lnode.type === "string" || lnode.type === "number") {
        const { left: leftInlineDiffs, right: rightInlineDiffs } = classify(
          compareInlineTexts(getRawValue(lnode)!, getRawValue(rnode)!),
        );

        if (leftInlineDiffs.length || rightInlineDiffs.length) {
          const left = Diff(lnode, "del", false);
          const right = Diff(rnode, "ins", false);
          left.inlineDiffs = newInlineDiffs(lnode, leftInlineDiffs);
          right.inlineDiffs = newInlineDiffs(rnode, rightInlineDiffs);
          pairs.push({ left, right });
        }
        // Other types are easy to identify differences, so there is no need for inline comparison.
      } else if (lnode.value !== rnode.value) {
        pairs.push({
          left: Diff(lnode, "del", false),
          right: Diff(rnode, "ins", false),
        });
      }
    },

    // Compares two arrays.
    diffArray(lnode: Node, rnode: Node) {
      const diffs = compareArray(
        ltree.mapChildren(lnode, (child) => ltree.getNodeToken(child)),
        rtree.mapChildren(rnode, (child) => rtree.getNodeToken(child)),
      );
      const { left, right } = classify(diffs);
      const n = Math.max(left.length, right.length);

      for (let i = 0; i < n; i++) {
        const delDiff = left[i];
        const insDiff = right[i];
        // Array index.
        const l = delDiff?.offset;
        const r = insDiff?.offset;

        // If the indexes of the differences on both sides are the same, recursively compare.
        if (delDiff && insDiff && l === r) {
          this.diff(ltree.getChild(lnode, String(l))!, rtree.getChild(rnode, String(r))!);
        } else {
          pairs.push({
            left: delDiff ? Diff(ltree.getChild(lnode, String(l))!, "del") : undefined,
            right: insDiff ? Diff(rtree.getChild(rnode, String(r))!, "ins") : undefined,
          });
        }
      }
    },

    // Compares two objects.
    diffObject(lnode: Node, rnode: Node) {
      const { intersection, leftOnly, rightOnly } = splitKeys(getChildrenKeys(lnode), getChildrenKeys(rnode));

      // Compare the same keys.
      intersection.forEach((k) => {
        this.diff(ltree.getChild(lnode, k)!, rtree.getChild(rnode, k)!);
      });

      // The remaining keys on the left and right sides are all considered differences.
      leftOnly.forEach((k) => {
        pairs.push({ left: Diff(ltree.getChild(lnode, k)!, "del") });
      });

      rightOnly.forEach((k) => {
        pairs.push({ right: Diff(rtree.getChild(rnode, k)!, "ins") });
      });
    },
  };

  comparer.diff(ltree.root(), rtree.root());
  return pairs;
}

/**
 * Compares two texts and returns an array of differences.
 * @param ltext - The left text.
 * @param rtext - The right text.
 * @returns An array of differences.
 */
export function compareText(ltext: string, rtext: string) {
  return histogramDiff(ltext, rtext);
}

function compareInlineTexts(ltext: string, rtext: string) {
  return myersDiff(ltext, rtext, { maxEditLength: 100 });
}

function compareArray(lvals: string[], rvals: string[]) {
  return arrayDiff(lvals, rvals, { maxEditLength: MaxEditLength });
}

function splitKeys(
  lkeys: string[],
  rkeys: string[],
): { intersection: Set<string>; leftOnly: Set<string>; rightOnly: Set<string> } {
  const intersection = new Set<string>();
  const leftOnly = new Set(lkeys);
  const rightOnly = new Set(rkeys);

  leftOnly.forEach((v) => {
    if (rightOnly.has(v)) {
      intersection.add(v);
      leftOnly.delete(v);
      rightOnly.delete(v);
    }
  });

  return { intersection, leftOnly, rightOnly };
}

if (import.meta.vitest) {
  const { it, expect } = import.meta.vitest;

  it("splitKeys", () => {
    const { intersection, leftOnly, rightOnly } = splitKeys(["a", "b", "c"], ["a", "c", "d"]);
    expect(intersection).toMatchObject(new Set(["a", "c"]));
    expect(leftOnly).toMatchObject(new Set(["b"]));
    expect(rightOnly).toMatchObject(new Set(["d"]));
  });

  it("arrayDiff", () => {
    expect(compareArray(["a", "b", "c"], ["a", "c", "d"])).toMatchObject([newDiff(1, 1, "del"), newDiff(2, 1, "ins")]);
  });
}
