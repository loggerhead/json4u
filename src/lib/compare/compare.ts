import { classify, type Diff, type DiffPair, DiffType, newDiff } from "@/lib/compare/";
import { getChildrenKeys, getRawValue, Node, Tree } from "@/lib/parser";
import { histogramDiff } from "./histogram";
import { arrayDiff, MaxEditLength, myersDiff } from "./myers";

export function compareJSON(ltree: Tree, rtree: Tree): DiffPair[] {
  const Diff = (node: Node, type: DiffType, includeBound: boolean = true) => {
    return includeBound ? newDiff(node.boundOffset, node.boundLength, type) : newDiff(node.offset, node.length, type);
  };

  // 行内 diff 转成全局 diff
  const newInlineDiffs = (node: Node, inlineDiffs: Diff[]) =>
    inlineDiffs.map((d) => {
      d.offset += node.offset;
      return d;
    });

  const pairs: DiffPair[] = [];

  const comparer = {
    // 比较值
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
        // 其他类型容易辨别差异，因此不需要进行行内比较
      } else if (lnode.value !== rnode.value) {
        pairs.push({
          left: Diff(lnode, "del", false),
          right: Diff(rnode, "ins", false),
        });
      }
    },

    // 比较数组
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
        // 数组下标
        const l = delDiff?.offset;
        const r = insDiff?.offset;

        // 如果两边差异的下标相同，则递归比较
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

    // 比较对象
    diffObject(lnode: Node, rnode: Node) {
      const { intersection, leftOnly, rightOnly } = splitKeys(getChildrenKeys(lnode), getChildrenKeys(rnode));

      // 比较相同的 key
      intersection.forEach((k) => {
        this.diff(ltree.getChild(lnode, k)!, rtree.getChild(rnode, k)!);
      });

      // 将左右两侧剩余的 key 全都算作差异
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
