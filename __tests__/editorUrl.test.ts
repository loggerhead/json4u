import { getInitialJSONFromSearch } from "@/containers/editor/editor/url";

describe("editor URL params", () => {
  test("reads encoded json param", () => {
    const json = '{"hello":"world","count":1}';

    expect(getInitialJSONFromSearch(`?json=${encodeURIComponent(json)}`)).toBe(json);
  });

  test("returns undefined when json param is absent", () => {
    expect(getInitialJSONFromSearch("?foo=bar")).toBeUndefined();
  });
});
