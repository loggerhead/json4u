import { urlToJSON } from "@/lib/worker/command/urlToJSON";

describe("urlToJSON", () => {
  test("complex", async () => {
    const m = await urlToJSON("https://json4u.com/editor?a=1&a=2&b=&c=https%3A%2F%2Fjson4u.com%2Feditor%3Fc%3D1");
    expect(JSON.parse(m.text)).toEqual(
      JSON.parse(
        `{
  "Protocol": "https",
  "Host": "json4u.com",
  "Path": "/editor",
  "Query": {
    "a": [
      "1",
      "2"
    ],
    "b": "",
    "c": {
      "Protocol": "https",
      "Host": "json4u.com",
      "Path": "/editor",
      "Query": {
        "c": "1"
      }
    }
  }
}`,
      ),
    );
  });
});
