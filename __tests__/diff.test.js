// jest 文档：https://jestjs.io/docs/expect
import * as diff from "../lib/diff";

describe("utils", () => {
  test("stringify4diff", () => {
    expect(
      diff.stringify4diff({
        a: BigInt("7777777777777777777"),
        b: "7777777777777777777",
        c: true,
      })
    ).toEqual(`{"a":"7777777777777777777n","b":"7777777777777777777s","c":true}`);
  });

  test("splitKeys", () => {
    expect(diff.splitKeys({ a: 1, b: 2, c: 3 }, { a: 1, c: 3, d: 4 })).toEqual([
      new Set(["a", "c"]),
      new Set(["b"]),
      new Set(["d"]),
    ]);
  });

  test("arrayDiff", () => {
    expect(
      diff.compareArray(
        [{ a: { aa: 1 } }, { b: { bb: 2 } }, { c: { cc: 3 } }],
        [{ a: { aa: 1 } }, { c: { cc: 3 } }, { d: { dd: 4 } }]
      )
    ).toEqual([new diff.Diff(1, 1, diff.DEL), new diff.Diff(2, 1, diff.INS)]);
  });
});

describe("Tree", () => {
  test("getNode", () => {
    const tree = new diff.Tree(`{
        "a": 7777777777777777777,
        "b": "7777777777777777777",
        "c": true,
    }`);
    const node = tree.getNode(["a"]);
    expect(node.type).toEqual("number");
    expect(node.value).toBeGreaterThan(0);
    expect(node.length).toBeGreaterThan(0);
    expect(node.offset).toBeGreaterThan(0);
  });

  test("getValue", () => {
    const tree = new diff.Tree(`{
        "a": 7777777777777777777,
        "b": "7777777777777777777",
        "c": true,
    }`);
    expect(tree.getValue(["a"])).toEqual("7777777777777777777");
    expect(tree.getValue(["b"])).toEqual(`"7777777777777777777"`);
    expect(tree.getValue(["c"])).toEqual("true");
  });
});

describe("Comparer", () => {
  expectEq = (ltext, rtext, expected) => {
    const c = new diff.Comparer(new diff.Tree(ltext), new diff.Tree(rtext));
    const diffs = c.compare();
    expect(diffs).toEqual(expected);
  };

  test("diffVal", () => {
    expectEq(`{ "foo": "abc" }`, `{ "foo": "adc" }`, [
      new diff.Diff(11, 1, diff.DEL, false, ["foo"]),
      new diff.Diff(11, 1, diff.INS, false, ["foo"]),
    ]);
  });

  test("diffArray", () => {
    expectEq(`[ "foo", "abc" ]`, `[ "foo", "adc" ]`, [
      new diff.Diff(11, 1, diff.DEL, false, [1]),
      new diff.Diff(11, 1, diff.INS, false, [1]),
    ]);
  });

  // TODO: 补充更多 case
  test("diffObject", () => {
    expectEq(
      `{
  "foo": "abc"
}`,
      `{
  "foo": "adc"
}`,
      [new diff.Diff(11, 1, diff.DEL, false, ["foo"]), new diff.Diff(11, 1, diff.INS, false, ["foo"])]
    );
  });
});

describe("semanticCompare", () => {
  test("charDiff", () => {
    const r = diff.semanticCompare(`  "foo": "abc" }`, `{ "foo": "adc" }`);
    expect(r.isTextCompare).toEqual(true);
    expect(r.diffs).toEqual([
      new diff.Diff(0, 1, diff.DEL, false),
      new diff.Diff(0, 1, diff.INS, false),
      new diff.Diff(11, 1, diff.DEL, false),
      new diff.Diff(11, 1, diff.INS, false),
    ]);
  });
});
