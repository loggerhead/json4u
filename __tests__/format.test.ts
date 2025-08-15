import { prettyFormat, findBracketPairs } from "@/lib/format/pretty";

describe("format", () => {
  const expectEq = (text: string, expected: string) => {
    const s = prettyFormat(text);
    expect(s).toEqual(expected);
  };

  test("example", () => {
    expectEq(
      String.raw`Info 2023-01-01 12:34:56.789 /root/json4u@v0.0.0-20230101123456-bbbbbbbbbbbb/golang/test.go:321 127.0.0.1  www.json4u.com 20230101123456789BBBBBBBBBBBBBBBBB  example all_things en 1111111111111111111 _name=hi-aaa-666  _ipv6=0:0:0:0:0:0:0:0  _msg=@CCCCCCCCCCCCCC.Function -> www.json4u.com#Function(cost=100ms) {{req=
{"foo":"bar","buz":{"qux":{"foobar":"{\"example\":\"321\"}"}}}
}} {{resp=
{"bar":"foo","qux":{"buz":{"foobar":"{\"example\":\"123\"}"}}}
}}`,
      String.raw`Info 2023-01-01 12:34:56.789 /root/json4u@v0.0.0-20230101123456-bbbbbbbbbbbb/golang/test.go:321 127.0.0.1  www.json4u.com 20230101123456789BBBBBBBBBBBBBBBBB  example all_things en 1111111111111111111 _name=hi-aaa-666  _ipv6=0:0:0:0:0:0:0:0  _msg=@CCCCCCCCCCCCCC.Function -> www.json4u.com#Function(cost=100ms) {{req=
{
  "foo": "bar",
  "buz": {
    "qux": {
      "foobar": "{\"example\":\"321\"}"
    }
  }
}
}} {{resp=
{
  "bar": "foo",
  "qux": {
    "buz": {
      "foobar": "{\"example\":\"123\"}"
    }
  }
}
}}`,
    );
  });

  test("end with }", () => {
    expectEq(
      `{"foo":"bar"}
}}`,
      `{
  "foo": "bar"
}
}}`,
    );
  });

  test("nest object and array", () => {
    expectEq(
      '{"foo":{"bar":[1]}}',
      `{
  "foo": {
    "bar": [
      1
    ]
  }
}`,
    );

    expectEq(
      '{"foo":{"bar":[1,2]}}',
      `{
  "foo": {
    "bar": [
      1,
      2
    ]
  }
}`,
    );
  });
});

describe("findBracketPairs", () => {
  const expectEq = (text: string, expected: [number, number][]) => {
    const pairs = findBracketPairs(text);
    expect(pairs).toEqual(expected);
  };

  it("should find a single valid JSON object", () => {
    const text = '{"a": 1, "b": true}';
    expectEq(text, [[0, text.length]]);
  });

  it("should find a single valid JSON array", () => {
    const text = '[1, "hello", null]';
    expectEq(text, [[0, text.length]]);
  });

  it("should find multiple top-level JSON objects", () => {
    const text = '{"a": 1} {"b": 2}';
    expectEq(text, [
      [0, 8],
      [9, 17],
    ]);
  });

  it("should handle nested structures correctly", () => {
    const text = '{"a": {"b": [1, 2]}, "c": 3}';
    expectEq(text, [[0, text.length]]);
  });

  it("should ignore invalid JSON and find valid ones", () => {
    const text = '{"a":,} [{"key": "value"}]';
    expectEq(text, [[8, text.length]]);
  });

  it("should handle text with no JSON", () => {
    const text = "this is just some text";
    expectEq(text, []);
  });

  it("should handle JSON with surrounding text", () => {
    const text = 'Here is a json: {"a": 1}. And another: [true].';
    expectEq(text, [
      [16, 24],
      [39, 45],
    ]);
  });

  it("should handle unterminated JSON gracefully", () => {
    const text = '{"a": 1';
    expectEq(text, []);
  });

  it("should handle complex strings with mixed content", () => {
    const text = 'invalid { { "a": 1 } } another invalid } { "b": [2] }';
    expectEq(text, [
      [10, 20],
      [41, text.length],
    ]);
  });
});
