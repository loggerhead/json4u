// jest 文档：https://jestjs.io/docs/expect
import * as diff from "../lib/diff";

function expectEq(ltext, rtext, expected, isTextCompare = false) {
  const r = diff.semanticCompare(ltext, rtext);
  expect(r.isTextCompare).toEqual(isTextCompare);
  expect(r.diffs).toEqual(expected);
  return r.isTextCompare;
}

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
  const tree = new diff.Tree(`{
        "a": 7777777777777777777,
        "b": "7777777777777777777",
        "c": true,
    }`);

  test("getKeyNode", () => {
    const node = tree.getKeyNode(["a"]);
    expect(node.length).toBeGreaterThan(0);
    expect(node.offset).toBeGreaterThan(0);
  });

  test("getKey", () => {
    expect(tree.getKey(["a"])).toEqual(`"a"`);
    expect(tree.getKey(["b"])).toEqual(`"b"`);
    expect(tree.getKey(["c"])).toEqual(`"c"`);
  });

  test("getValueNode", () => {
    const node = tree.getValueNode(["a"]);
    expect(node.type).toEqual("number");
    expect(node.value).toBeGreaterThan(0);
    expect(node.length).toBeGreaterThan(0);
    expect(node.offset).toBeGreaterThan(0);
  });

  test("getValue", () => {
    expect(tree.getValue(["a"])).toEqual("7777777777777777777");
    expect(tree.getValue(["b"])).toEqual(`"7777777777777777777"`);
    expect(tree.getValue(["c"])).toEqual("true");
  });
});

describe("Comparer", () => {
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

    expectEq(`[12, 34]`, `[12, 23, 34]`, [new diff.Diff(5, 2, diff.INS, true, [1])]);
  });
});

describe("semanticCompare", () => {
  test("char compare", () => {
    expectEq(
      `  "foo": "abc" }`,
      `{ "foo": "adc" }`,
      [
        new diff.Diff(0, 1, diff.INS, false),
        new diff.Diff(11, 1, diff.DEL, false),
        new diff.Diff(11, 1, diff.INS, false),
      ],
      true
    );
    expectEq(
      `[
     ,
    2
`,
      `[
    1,
    2
]`,
      [new diff.Diff(6, 1, diff.INS, false), new diff.Diff(15, 1, diff.INS, false)],
      true
    );
  });

  test("key compare", () => {
    expectEq(`{ "foo": { "bar": 123 } }`, `{ "foo": { "bzr": 123 } }`, [
      new diff.Diff(13, 1, diff.DEL, false, ["foo", "bar"]),
      new diff.Diff(13, 1, diff.INS, false, ["foo", "bzr"]),
    ]);
  });

  test("compare array", () => {
    expectEq(
      `[
    {
      "foo": 1,
      "bar": "baz",
      "values": [
        "1777777777777777"
      ]
    },
    {
      "foo": 9,
      "bar": "qux",
      "values": [
        "1690848000000",
        "1691193600000"
      ]
    }
]`,
      `[
    {
      "foo": 7,
      "bar": "baz",
      "values": [
        "1777777777777777"
      ]
    },
    {
      "foo": 9,
      "bar": "qux",
      "values": [
        "0xc000c6e720",
        "0xc000c6e728"
      ]
    }
]`,
      [
        new diff.Diff(21, 1, diff.DEL, false, [0, "foo"]),
        new diff.Diff(21, 1, diff.INS, false, [0, "foo"]),
        new diff.Diff(173, 12, diff.DEL, false, [1, "values", 0]),
        new diff.Diff(173, 11, diff.INS, false, [1, "values", 0]),
        new diff.Diff(197, 12, diff.INS, false, [1, "values", 1]),
        new diff.Diff(198, 13, diff.DEL, false, [1, "values", 1]),
      ]
    );
  });
});
