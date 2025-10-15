import { parseJSON } from "@/lib/parser/parse";
import { buildTableTree } from "@/lib/table/builder";
import type { TableNode } from "@/lib/table/types";
import { isDummyType } from "@/lib/table/utils";

function checkText(jsonStr: string, expectGrid: Partial<TableNode>[][]) {
  const tree = parseJSON(jsonStr);
  const tableTree = buildTableTree(tree);
  const actualGrid: Partial<TableNode>[][] = tableTree.grid.map((row) =>
    row.map((cell) => (isDummyType(cell.type) ? { type: cell.type } : { type: cell.type, text: cell.text })),
  );
  expect(actualGrid).toEqual(expectGrid);
}

function checkStyle(jsonStr: string, expectGrid: Partial<TableNode>[][]) {
  const tree = parseJSON(jsonStr);
  const tableTree = buildTableTree(tree);
  const actualGrid: Partial<TableNode>[][] = tableTree.grid.map((row) =>
    row.map((cell) => ({
      width: cell.width,
      type: cell.type,
      text: isDummyType(cell.type) ? undefined : cell.text,
    })),
  );
  expect(actualGrid).toEqual(expectGrid);
}

describe("buildTableTree", () => {
  test("value", () => {
    checkText("6", [[{ type: "value", text: "6" }]]);
  });

  test("empty object", () => {
    checkText("{}", [[{ type: "value", text: "{}" }]]);
  });

  test("empty array", () => {
    checkText("[]", [[{ type: "value", text: "[]" }]]);
  });

  test("simple object", () => {
    checkText(
      `{
  "int64": 12345678987654321,
  "key": "value"
}`,
      [
        [
          { type: "key", text: "int64" },
          { type: "value", text: "12345678987654321" },
        ],
        [
          { type: "key", text: "key" },
          { type: "value", text: "value" },
        ],
      ],
    );
  });

  test("object inside object", () => {
    checkText(
      `{
  "int64": 12345678987654321,
  "key": "value",
  "array": {"a": 1, "b": 2}
}`,
      [
        [
          { type: "key", text: "int64" },
          { type: "value", text: "12345678987654321" },
        ],
        [
          { type: "key", text: "key" },
          { type: "value", text: "value" },
        ],
        [
          { type: "key", text: "array" },
          { type: "key", text: "a" },
          { type: "value", text: "1" },
        ],
        [{ type: "dummyKey" }, { type: "key", text: "b" }, { type: "value", text: "2" }],
      ],
    );
  });

  test("array inside object", () => {
    checkText(
      `{
  "int64": 12345678987654321,
  "key": "value",
  "array": [12345678987654321, 0.1234567891111111111]
}`,
      [
        [
          { type: "key", text: "int64" },
          { type: "value", text: "12345678987654321" },
        ],
        [
          { type: "key", text: "key" },
          { type: "value", text: "value" },
        ],
        [
          { type: "key", text: "array" },
          { type: "index", text: "0" },
          { type: "value", text: "12345678987654321" },
        ],
        [{ type: "dummyKey" }, { type: "index", text: "1" }, { type: "value", text: "0.1234567891111111111" }],
      ],
    );
  });

  test("simple array", () => {
    checkText("[12345678987654321, 0.1234567891111111111]", [
      [
        { type: "index", text: "0" },
        { type: "value", text: "12345678987654321" },
      ],
      [
        { type: "index", text: "1" },
        { type: "value", text: "0.1234567891111111111" },
      ],
    ]);
  });

  test("object inside array", () => {
    checkText('[{"a": 1}, {"b": 2}]', [
      [
        { type: "header", text: "a" },
        { type: "header", text: "b" },
      ],
      [
        { type: "value", text: "1" },
        { type: "value", text: "miss" },
      ],
      [
        { type: "value", text: "miss" },
        { type: "value", text: "2" },
      ],
    ]);
  });

  test("array inside array", () => {
    checkText("[[11, 12], [23, 24]]", [
      [
        { type: "header", text: "0" },
        { type: "header", text: "1" },
      ],
      [
        { type: "value", text: "11" },
        { type: "value", text: "12" },
      ],
      [
        { type: "value", text: "23" },
        { type: "value", text: "24" },
      ],
    ]);
  });

  test("mixed array with string and object", () => {
    checkText('["a",{"foo":"bar"},"c"]', [
      [{ type: "dummyIndex" }, { type: "dummyHeader" }, { type: "header", text: "foo" }],
      [{ type: "index", text: "0" }, { type: "value", text: "a" }, { type: "dummyValue" }],
      [{ type: "index", text: "1" }, { type: "dummyValue" }, { type: "value", text: "bar" }],
      [{ type: "index", text: "2" }, { type: "value", text: "c" }, { type: "dummyValue" }],
    ]);
  });

  test("check style of complex array", () => {
    checkStyle(
      `[{
  "simple object": {
    "foo": "bar"
  },
  "simple array": [
    {
      "index": 0,
      "": "empty string"
    }
  ]
}]`,
      [
        [
          { text: "simple object", type: "header", width: 130 },
          { text: "simple array", type: "header", width: 179 },
        ],
        [
          { text: "foo", type: "key", width: 40 },
          { text: "bar", type: "value", width: 90 },
          { text: "index", type: "header", width: 58 },
          { text: '""', type: "header", width: 121 },
        ],
        [
          { type: "dummyKey", width: 40 },
          { type: "dummyValue", width: 90 },
          { text: "0", type: "value", width: 58 },
          { text: "empty string", type: "value", width: 121 },
        ],
      ],
    );
  });
});
