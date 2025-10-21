import { parseJSON } from "@/lib/parser/parse";
import { buildTableGrid } from "@/lib/table/builder";
import { TableNode } from "@/lib/table/tableNode";
import { isDummyType } from "@/lib/table/utils";

function checkText(jsonStr: string, expectGrid: Partial<TableNode>[][]) {
  const tree = parseJSON(jsonStr);
  const tableGrid = buildTableGrid(tree);
  const actualGrid: Partial<TableNode>[][] = tableGrid.grid.map((row) =>
    row.map((cell) => (isDummyType(cell.type) ? { type: cell.type } : { type: cell.type, text: cell.text })),
  );
  expect(actualGrid).toEqual(expectGrid);
}

function checkStyle(jsonStr: string, expectGrid: Partial<TableNode>[][]) {
  const tree = parseJSON(jsonStr);
  const tableGrid = buildTableGrid(tree);
  const actualGrid: Partial<TableNode>[][] = tableGrid.grid.map((row) =>
    row.map((cell) => {
      const nd: Partial<TableNode> = {
        x: cell.x,
        width: cell.width,
        type: cell.type,
      };
      if (!isDummyType(cell.type)) {
        nd.text = cell.text;
      }
      return nd;
    }),
  );
  expect(actualGrid).toEqual(expectGrid);
}

describe("buildTableGrid", () => {
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

  test("check style of complex object 1", () => {
    checkStyle(
      `{
  "row1": 1,
  "r2": {
    "a": 2,
    "bb": {
      "ccc": 3
    }
  },
  "the fourth row": "loooooooooooong"
}`,
      [
        [
          { text: "row1", type: "key", x: 0, width: 139 },
          { text: "1", type: "value", x: 139, width: 148 },
        ],
        [
          { text: "r2", type: "key", x: 0, width: 139 },
          { text: "a", type: "key", x: 139, width: 31 },
          { text: "2", type: "value", x: 170, width: 117 },
        ],
        [
          { type: "dummyKey", x: 0, width: 139 },
          { text: "bb", type: "key", x: 139, width: 31 },
          { text: "ccc", type: "key", x: 170, width: 40 },
          { text: "3", type: "value", x: 210, width: 77 },
        ],
        [
          { text: "the fourth row", type: "key", x: 0, width: 139 },
          { text: "loooooooooooong", type: "value", x: 139, width: 148 },
        ],
      ],
    );
  });

  test("check style of complex object 2", () => {
    checkStyle(
      `{
  "r0c0": [
    {
      "r0c1": 11,
      "r0c2": {
        "r1c2": 13,
        "r2c2": 23,
        "r3c2": 33
      }
    }
  ],
  "r4c0": [
    {
      "r4c1": 51
    }
  ]
}`,
      [
        [
          { text: "r0c0", type: "key", x: 0, width: 49 },
          { text: "r0c1", type: "header", x: 49, width: 49 },
          { text: "r0c2", type: "header", x: 98, width: 80 },
        ],
        [
          { type: "dummyKey", x: 0, width: 49 },
          { text: "11", type: "value", x: 49, width: 49 },
          { text: "r1c2", type: "key", x: 98, width: 49 },
          { text: "13", type: "value", x: 147, width: 31 },
        ],
        [
          { type: "dummyKey", x: 0, width: 49 },
          { type: "dummyValue", x: 49, width: 49 },
          { text: "r2c2", type: "key", x: 98, width: 49 },
          { text: "23", type: "value", x: 147, width: 31 },
        ],
        [
          { type: "dummyKey", x: 0, width: 49 },
          { type: "dummyValue", x: 49, width: 49 },
          { text: "r3c2", type: "key", x: 98, width: 49 },
          { text: "33", type: "value", x: 147, width: 31 },
        ],
        [
          { text: "r4c0", type: "key", x: 0, width: 49 },
          { text: "r4c1", type: "header", x: 49, width: 129 },
        ],
        [
          { type: "dummyKey", x: 0, width: 49 },
          { text: "51", type: "value", x: 49, width: 129 },
        ],
      ],
    );
  });

  test("check style of array inside object 1", () => {
    checkStyle(
      `{
  "col1": [
    {
      "col2": {
        "r1c1": 1,
        "r2c1": 2,
        "r3c1": 3
      }
    }
  ]
}`,
      [
        [
          { text: "col1", type: "key", x: 0, width: 49 },
          { text: "col2", type: "header", x: 49, width: 71 },
        ],
        [
          { type: "dummyKey", x: 0, width: 49 },
          { text: "r1c1", type: "key", x: 49, width: 49 },
          { text: "1", type: "value", x: 98, width: 22 },
        ],
        [
          { type: "dummyKey", x: 0, width: 49 },
          { text: "r2c1", type: "key", x: 49, width: 49 },
          { text: "2", type: "value", x: 98, width: 22 },
        ],
        [
          { type: "dummyKey", x: 0, width: 49 },
          { text: "r3c1", type: "key", x: 49, width: 49 },
          { text: "3", type: "value", x: 98, width: 22 },
        ],
      ],
    );
  });

  test("check style of array inside object 2", () => {
    checkStyle(
      `{
  "r0c0": [
    {
      "r0c1": {
        "r1c1": [
          13,
          23
        ]
      }
    }
  ],
  "r3c0": 31
}`,
      [
        [
          { text: "r0c0", type: "key", x: 0, width: 49 },
          { text: "r0c1", type: "header", x: 49, width: 102 },
        ],
        [
          { type: "dummyKey", x: 0, width: 49 },
          { text: "r1c1", type: "key", x: 49, width: 49 },
          { text: "0", type: "index", x: 98, width: 22 },
          { text: "13", type: "value", x: 120, width: 31 },
        ],
        [
          { type: "dummyKey", x: 0, width: 49 },
          { type: "dummyKey", x: 49, width: 49 },
          { text: "1", type: "index", x: 98, width: 22 },
          { text: "23", type: "value", x: 120, width: 31 },
        ],
        [
          { text: "r3c0", type: "key", x: 0, width: 49 },
          { text: "31", type: "value", x: 49, width: 102 },
        ],
      ],
    );
  });

  test("check style of complex array 1", () => {
    checkStyle(
      `[{
  "simple object": {
    "foo": "bar"
  },
  "simple array": [
    {
      "index": 0,
      "": "empty string"
    },
    {
      "index": 0,
      "": "empty string"
    }
  ]
}]`,
      [
        [
          { text: "simple object", type: "header", x: 0, width: 130 },
          { text: "simple array", type: "header", x: 130, width: 179 },
        ],
        [
          { text: "foo", type: "key", x: 0, width: 40 },
          { text: "bar", type: "value", x: 40, width: 90 },
          { text: "index", type: "header", x: 130, width: 58 },
          { text: '""', type: "header", x: 188, width: 121 },
        ],
        [
          { type: "dummyKey", x: 0, width: 40 },
          { type: "dummyValue", x: 40, width: 90 },
          { text: "0", type: "value", x: 130, width: 58 },
          { text: "empty string", type: "value", x: 188, width: 121 },
        ],
        [
          { type: "dummyKey", x: 0, width: 40 },
          { type: "dummyValue", x: 40, width: 90 },
          { text: "0", type: "value", x: 130, width: 58 },
          { text: "empty string", type: "value", x: 188, width: 121 },
        ],
      ],
    );
  });

  test("check style of complex array 2", () => {
    checkStyle(
      `{
  "first": [
    {
      "second": 2,
      "third": [
        {
          "header-of-third": 3
        }
      ]
    }
  ]
}`,
      [
        [
          { text: "first", type: "key", x: 0, width: 58 },
          { text: "second", type: "header", x: 58, width: 67 },
          { text: "third", type: "header", x: 125, width: 148 },
        ],
        [
          { type: "dummyKey", x: 0, width: 58 },
          { text: "2", type: "value", x: 58, width: 67 },
          { text: "header-of-third", type: "header", x: 125, width: 148 },
        ],
        [
          { type: "dummyKey", x: 0, width: 58 },
          { type: "dummyValue", x: 58, width: 67 },
          { text: "3", type: "value", x: 125, width: 148 },
        ],
      ],
    );
  });

  test("check style of complex array 3", () => {
    checkStyle(
      `[
  {
    "foo": [
      {
        "c0": "20",
        "c1": "21"
      }
    ],
    "bar": {
      "r1c2": 14,
      "r2c2": 24,
      "r3c2": 34
    }
  }
]`,
      [
        [
          { text: "foo", type: "header", x: 0, width: 62 },
          { text: "bar", type: "header", x: 62, width: 80 },
        ],
        [
          { text: "c0", type: "header", x: 0, width: 31 },
          { text: "c1", type: "header", x: 31, width: 31 },
          { text: "r1c2", type: "key", x: 62, width: 49 },
          { text: "14", type: "value", x: 111, width: 31 },
        ],
        [
          { text: "20", type: "value", x: 0, width: 31 },
          { text: "21", type: "value", x: 31, width: 31 },
          { text: "r2c2", type: "key", x: 62, width: 49 },
          { text: "24", type: "value", x: 111, width: 31 },
        ],
        [
          { type: "dummyValue", x: 0, width: 31 },
          { type: "dummyValue", x: 31, width: 31 },
          { text: "r3c2", type: "key", x: 62, width: 49 },
          { text: "34", type: "value", x: 111, width: 31 },
        ],
      ],
    );
  });

  test("check style of complex array 4", () => {
    checkStyle(
      `[
  {
    "h1": {
      "r1c0": 1,
      "r2c0": 2,
      "r3c0": 3
    },
    "h2": 4,
    "h3": {
      "r1c3": 5
    },
    "h4": [
      {
        "r1c5": 6,
        "r1c6": {
          "r2c6": 7
        }
      }
    ]
  }
]`,
      [
        [
          { text: "h1", type: "header", x: 0, width: 71 },
          { text: "h2", type: "header", x: 71, width: 31 },
          { text: "h3", type: "header", x: 102, width: 71 },
          { text: "h4", type: "header", x: 173, width: 120 },
        ],
        [
          { text: "r1c0", type: "key", x: 0, width: 49 },
          { text: "1", type: "value", x: 49, width: 22 },
          { text: "4", type: "value", x: 71, width: 31 },
          { text: "r1c3", type: "key", x: 102, width: 49 },
          { text: "5", type: "value", x: 151, width: 22 },
          { text: "r1c5", type: "header", x: 173, width: 49 },
          { text: "r1c6", type: "header", x: 222, width: 71 },
        ],
        [
          { text: "r2c0", type: "key", x: 0, width: 49 },
          { text: "2", type: "value", x: 49, width: 22 },
          { type: "dummyValue", x: 71, width: 31 },
          { type: "dummyKey", x: 102, width: 49 },
          { type: "dummyValue", x: 151, width: 22 },
          { text: "6", type: "value", x: 173, width: 49 },
          { text: "r2c6", type: "key", x: 222, width: 49 },
          { text: "7", type: "value", x: 271, width: 22 },
        ],
        [
          { text: "r3c0", type: "key", x: 0, width: 49 },
          { text: "3", type: "value", x: 49, width: 22 },
          { type: "dummyValue", x: 71, width: 31 },
          { type: "dummyKey", x: 102, width: 49 },
          { type: "dummyValue", x: 151, width: 22 },
          { type: "dummyValue", x: 173, width: 49 },
          { type: "dummyKey", x: 222, width: 49 },
          { type: "dummyValue", x: 271, width: 22 },
        ],
      ],
    );
  });
});
