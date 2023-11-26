// jest 文档：https://jestjs.io/docs/expect
import * as format from "../lib/format";

describe("format", () => {
  function expectEq(text, expected) {
    const s = format.format(text);
    expect(s).toEqual(expected);
  }

  test("example", () => {
    expectEq(
      `Info 2023-01-01 12:34:56.789 /root/json4u@v0.0.0-20230101123456-bbbbbbbbbbbb/golang/test.go:321 127.0.0.1  www.json4u.com 20230101123456789BBBBBBBBBBBBBBBBB  example all_things en 1111111111111111111 _name=hi-aaa-666  _ipv6=0:0:0:0:0:0:0:0  _msg=@CCCCCCCCCCCCCC.Function -> www.json4u.com#Function(cost=100ms) {{req=
{"foo":"bar","buz":{"qux":{"foobar":"{\"example\":\"321\"}"}}}
}} {{resp=
{"bar":"foo","qux":{"buz":{"foobar":"{\"example\":\"123\"}"}}}
}}`,
      `Info 2023-01-01 12:34:56.789 /root/json4u@v0.0.0-20230101123456-bbbbbbbbbbbb/golang/test.go:321 127.0.0.1  www.json4u.com 20230101123456789BBBBBBBBBBBBBBBBB  example all_things en 1111111111111111111 _name=hi-aaa-666  _ipv6=0:0:0:0:0:0:0:0  _msg=@CCCCCCCCCCCCCC.Function -> www.json4u.com#Function(cost=100ms) {
    {
        req={
            "foo": "bar",
            "buz": {
                "qux": {
                    "foobar": "{\"example\":\"321\"}"
                }
            }
        }
    }
} {
    {
        resp={
            "bar": "foo",
            "qux": {
                "buz": {
                    "foobar": "{\"example\":\"123\"}"
                }
            }
        }
    }
}`,
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
});
