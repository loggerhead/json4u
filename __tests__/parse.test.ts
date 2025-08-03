import { rootMarker } from "@/lib/idgen";
import { ParseOptions, isEquals, Node, getRawValue, isIterable } from "@/lib/parser";
import { parseJSON } from "@/lib/parser/parse";
import { random } from "lodash-es";
import { readFileIfNeed } from "./utils";

function expectEq(text: string, expected: string, options: ParseOptions = {}) {
  const tree = parseJSON(text, options);
  expect(tree.hasError()).toEqual(false);
  expect(tree.stringify(options)).toEqual(expected);
  expect(tree.toJSON()).toEqual(JSON.parse(expected));

  const check = (node: Node) => {
    expect(node.id.startsWith(rootMarker)).toEqual(true);
    if (!isIterable(node)) {
      expect(tree.text.substring(node.offset, node.offset + node.length)).toEqual(getRawValue(node));
    }
    tree.mapChildren(node, (child) => check(child));
  };

  check(tree.root());
}

function genJSON(maxDepth = 5): any {
  switch (random(0, 2)) {
    case 0: {
      const v: any = {};
      for (let i = 0; i < random(0, 3); i++) {
        v[`${i}`] = genJSON(maxDepth - 1);
      }
      return v;
    }
    case 1: {
      const v = [];
      for (let i = 0; i < random(0, 3); i++) {
        v.push(genJSON(maxDepth - 1));
      }
      return v;
    }
    case 2: {
      const vv = [0, "", true, false, null];
      return vv[random(0, vv.length - 1)];
    }
  }
}

describe("parseJSON", () => {
  test("error", () => {
    const tree = parseJSON("{a}", { nest: true });
    expect(tree.hasError()).toEqual(true);
  });

  test("object", () => {
    expectEq(
      '{ "int64": 12345678987654321, "key": "value", "array": [12345678987654321, 0.1234567891111111111] }',
      '{"int64":12345678987654321,"key":"value","array":[12345678987654321,0.1234567891111111111]}',
    );
  });

  test("array", () => {
    expectEq(
      '[ { "int64": 12345678987654321 }, { "float64": 0.1234567891111111111 } ]',
      '[{"int64":12345678987654321},{"float64":0.1234567891111111111}]',
    );
    expectEq('[ "a", "b" ]', '["a","b"]');
  });

  test("value", () => {
    expectEq('"hello"', '"hello"');
    expectEq("12345678987654321", "12345678987654321");
    expectEq("0.1234567891111111111", "0.1234567891111111111");
    expectEq("true", "true");
    expectEq("null", "null");
  });

  test("nest parse", () => {
    expectEq(String.raw`{"a":"{\"bb\":\"2\"}"}`, '{"a":{"bb":"2"}}', { nest: true });
    expectEq(String.raw`{"a":"{\"bb\":\"{\\\"ccc\\\":3}\"}"}`, '{"a":{"bb":{"ccc":3}}}', { nest: true });
  });

  test("escaped key", () => {
    expectEq(String.raw`{"{\"a\":   0}": 1}`, String.raw`{"{\"a\":   0}":1}`);
  });

  test("equal with JSON.parse", () => {
    const ss = [
      `[
  { "a": "1" },
  { "b": "2" },
  { "c": "3" },
  { "d": "4" }
]`,
      '[ { "a": [] }, 1, 2 ]',
    ];

    for (const s of ss) {
      const t1 = parseJSON(s);
      const j2 = JSON.parse(s);
      expect(t1.stringify()).toEqual(JSON.stringify(j2));
    }
  });

  test("random JSON", () => {
    for (let i = 0; i < 100; i++) {
      const o = genJSON(10);
      const s = JSON.stringify(o);
      const t = parseJSON(s);
      expect(t.stringify()).toEqual(s);
    }
  });

  test("complex.txt with bigint", () => {
    const s = readFileIfNeed("complex.txt");
    const t = parseJSON(s, { nest: false, format: true, prettyMaxWidth: 120 });
    const node = t.node(
      "$/we___are___such___stuff___as___dreams___are___made___on___and___our___little___life___is___rounded___with___sleep/199/inner%20object/0/object1/user_id",
    );
    expect(getRawValue(node)).toEqual("9876543210123456789");
  });
});

describe("stringify sort", () => {
  test("stringify sort", () => {
    expectEq(
      '{ "c": 12345678987654321, "a": "value", "b": [{"d": 12345678987654321, "f": 0.1234567891111111111, "e": 1}]}',
      '{"a":"value","b":[{"d":12345678987654321,"e":1,"f":0.1234567891111111111}],"c":12345678987654321}',
      { sort: "asc" },
    );
    expectEq(
      '{ "c": 12345678987654321, "a": "value", "b": [{"d": 12345678987654321, "f": 0.1234567891111111111, "e": 1}]}',
      '{"c":12345678987654321,"b":[{"f":0.1234567891111111111,"e":1,"d":12345678987654321}],"a":"value"}',
      { sort: "desc" },
    );

    expectEq(
      '[ { "int64": 12345678987654321 }, { "float64": 0.1234567891111111111 } ]',
      '[{"int64":12345678987654321},{"float64":0.1234567891111111111}]',
      { sort: "asc" },
    );
    expectEq(
      '[ { "int64": 12345678987654321 }, { "float64": 0.1234567891111111111 } ]',
      '[{"int64":12345678987654321},{"float64":0.1234567891111111111}]',
      { sort: "desc" },
    );
  });
});

describe("isEquals", () => {
  function expectIsEquals(text1: string, text2: string, expected: boolean = true) {
    const tree1 = parseJSON(text1);
    const tree2 = parseJSON(text2);
    expect(tree1.hasError()).toEqual(false);
    expect(tree2.hasError()).toEqual(false);
    expect(isEquals(tree1, tree2)).toEqual(expected);
  }

  test("object", () => {
    expectIsEquals(
      '{ "int64": 12345678987654321, "key": "value", "array": [12345678987654321, 0.1234567891111111111]}',
      '{ "key": "value", "array": [12345678987654321, 0.1234567891111111111], "int64": 12345678987654321 }',
    );
  });

  test("array", () => {
    expectIsEquals(
      '[ { "int64": 12345678987654321 }, { "float64": 0.1234567891111111111 } ]',
      '[ { "float64": 0.1234567891111111111 }, { "int64": 12345678987654321 } ]',
      false,
    );
  });

  test("value", () => {
    expectIsEquals('"hello"', '"hello"');
    expectIsEquals("12345678987654321", "12345678987654321");
    expectIsEquals("0.1234567891111111111", "0.1234567891111111111");
    expectIsEquals("true", "true");
    expectIsEquals("null", "null");
    expectIsEquals("12345678987654321", '"12345678987654321"', false);
    expectIsEquals("12345678987654321", "12345678987654320", false);
    expectIsEquals("0.1234567891111111111", '"0.1234567891111111111"', false);
    expectIsEquals("0.1234567891111111111", "0.1234567891111111110", false);
    expectIsEquals("true", '"true"', false);
    expectIsEquals("null", '"null"', false);
  });
});

describe("parse errors", () => {
  test("addition ,", () => {
    const tree = parseJSON(
      `{
    "foo": [
      "first",
      "second
    ],
    "bar": 3
}`,
      { format: false },
    );

    expect(tree.hasError()).toEqual(true);
    const { offset, length, context } = tree.errors![0];
    expect(context).toEqual([
      `{
    "foo": [
      "first",
      `,
      '"second',
      `
    ],
    "bar": 3
}`,
    ]);
    expect(offset).toEqual(36);
    expect(length).toEqual(7);
  });
});
