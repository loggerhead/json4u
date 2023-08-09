// jest 文档：https://jestjs.io/docs/expect
import * as url from "../lib/url";

describe("urlToJsonString", () => {
  function expectEq(text, expected) {
    const s = url.urlToJsonString(text);
    expect(s).toEqual(expected);
  }

  test("complicated url", () => {
    expectEq(
      "sc://uu:pp@web:8000/?url=https%3A%2F%2Fmain.cdn.com%2Ffoo%2Fbar.html%3F_buz%3D1%26inner%3D1%26inner_q%3Dhttps%3A%2F%2Fexample.com#myhash",
      `{"Scheme":"sc:","Username":"uu","Password":"pp","Host":"web","Port":"8000","Hash":"#myhash","Query":{"url":{"Scheme":"https:","Host":"main.cdn.com","Path":"/foo/bar.html","Query":{"_buz":"1","inner":"1","inner_q":{"Scheme":"https:","Host":"example.com"}}}}}`
    );
  });
});
