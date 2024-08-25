// jest 文档：https://jestjs.io/docs/expect
import * as parser from "../lib/parser";

describe("parseJSON", () => {
  function expectEq(text, expected, nest = false) {
    const node = parser.parseJSON(text, {nest: nest});
    expect(node.hasError()).toEqual(false);
    expect(node.stringify()).toEqual(expected);
  }

  test("object", () => {
    expectEq(
      `{ "int64": 12345678987654321, "key": "value", "array": [12345678987654321, 0.1234567891111111111]}`,
      `{"int64":12345678987654321,"key":"value","array":[12345678987654321,0.1234567891111111111]}`,
    );
  });

  test("array", () => {
    expectEq(
      `[ { "int64": 12345678987654321 }, { "float64": 0.1234567891111111111 } ]`,
      `[{"int64":12345678987654321},{"float64":0.1234567891111111111}]`,
    );
  });

  test("value", () => {
    expectEq(`"hello"`, `"hello"`);
    expectEq(`12345678987654321`, `12345678987654321`);
    expectEq(`0.1234567891111111111`, `0.1234567891111111111`);
    expectEq(`true`, `true`);
    expectEq(`null`, `null`);
  });

  test("nest parse", () => {
    expectEq(`{"a":"{\\"bb\\":\\"2\\"}"}`, `{"a":{"bb":"2"}}`, true);
    expectEq(`{"a":"{\\"bb\\":\\"{\\\\\\"ccc\\\\\\":3}\\"}"}`, `{"a":{"bb":{"ccc":3}}}`, true);
  });
});

describe("stringify sort", () => {
  function expectEq(text, expected, order = "") {
    const node = parser.parseJSON(text);
    expect(node.hasError()).toEqual(false);
    expect(node.stringify({order: order})).toEqual(expected);
  }

  test("stringify sort", () => {
    expectEq(
      `{ "c": 12345678987654321, "a": "value", "b": [{"d": 12345678987654321, "f": 0.1234567891111111111, "e": 1}]}`,
      `{"a":"value","b":[{"d":12345678987654321,"e":1,"f":0.1234567891111111111}],"c":12345678987654321}`,
      "asc",
    );
    expectEq(
      `{ "c": 12345678987654321, "a": "value", "b": [{"d": 12345678987654321, "f": 0.1234567891111111111, "e": 1}]}`,
      `{"c":12345678987654321,"b":[{"f":0.1234567891111111111,"e":1,"d":12345678987654321}],"a":"value"}`,
      "desc",
    );

    expectEq(
      `[ { "int64": 12345678987654321 }, { "float64": 0.1234567891111111111 } ]`,
      `[{"int64":12345678987654321},{"float64":0.1234567891111111111}]`,
      "asc",
    );
    expectEq(
      `[ { "int64": 12345678987654321 }, { "float64": 0.1234567891111111111 } ]`,
      `[{"int64":12345678987654321},{"float64":0.1234567891111111111}]`,
      "desc",
    );
  });
});

describe("sort", () => {
  function expectEq(text, expected, reverse = false) {
    const options = {order: reverse ? "desc" : "asc"};
    const node = parser.parseJSON(text, options);
    expect(node.hasError()).toEqual(false);
    expect(node.stringify(options)).toEqual(expected);
  }

  test("sort", () => {
    expectEq(
      `{ "c": 12345678987654321, "a": "value", "b": [{"d": 12345678987654321, "f": 0.1234567891111111111, "e": 1}]}`,
      `{"a":"value","b":[{"d":12345678987654321,"e":1,"f":0.1234567891111111111}],"c":12345678987654321}`,
    );
    expectEq(
      `{ "c": 12345678987654321, "a": "value", "b": [{"d": 12345678987654321, "f": 0.1234567891111111111, "e": 1}]}`,
      `{"c":12345678987654321,"b":[{"f":0.1234567891111111111,"e":1,"d":12345678987654321}],"a":"value"}`,
      true,
    );

    expectEq(
      `[ { "int64": 12345678987654321 }, { "float64": 0.1234567891111111111 } ]`,
      `[{"int64":12345678987654321},{"float64":0.1234567891111111111}]`,
    );
    expectEq(
      `[ { "int64": 12345678987654321 }, { "float64": 0.1234567891111111111 } ]`,
      `[{"int64":12345678987654321},{"float64":0.1234567891111111111}]`,
      true,
    );
  });
});

describe("isEquals", () => {
  function expectEq(text1, text2, expected = true) {
    const node1 = parser.parseJSON(text1);
    const node2 = parser.parseJSON(text2);
    expect(node1.hasError()).toEqual(false);
    expect(node2.hasError()).toEqual(false);
    expect(node1.isEquals(node2)).toEqual(expected);
  }

  test("object", () => {
    expectEq(
      `{ "int64": 12345678987654321, "key": "value", "array": [12345678987654321, 0.1234567891111111111]}`,
      `{ "key": "value", "array": [12345678987654321, 0.1234567891111111111], "int64": 12345678987654321 }`,
    );
  });

  test("array", () => {
    expectEq(
      `[ { "int64": 12345678987654321 }, { "float64": 0.1234567891111111111 } ]`,
      `[ { "float64": 0.1234567891111111111 }, { "int64": 12345678987654321 } ]`,
      false,
    );
  });

  test("value", () => {
    expectEq(`"hello"`, `"hello"`);
    expectEq(`12345678987654321`, `12345678987654321`);
    expectEq(`0.1234567891111111111`, `0.1234567891111111111`);
    expectEq(`true`, `true`);
    expectEq(`null`, `null`);
    expectEq(`12345678987654321`, `"12345678987654321"`, false);
    expectEq(`12345678987654321`, `12345678987654320`, false);
    expectEq(`0.1234567891111111111`, `"0.1234567891111111111"`, false);
    expectEq(`0.1234567891111111111`, `0.1234567891111111110`, false);
    expectEq(`true`, `"true"`, false);
    expectEq(`null`, `"null"`, false);
  });
});
