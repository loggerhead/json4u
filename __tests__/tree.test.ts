import { parseJSON } from "@/lib/parser/parse";

describe("findNodeAtOffset", () => {
  const tree = parseJSON('{ "array": [12345678987654321, 0.1234567891111111111] }');

  const expectOffset = (offset: number, id: string | undefined) => {
    const r = tree.findNodeAtOffset(offset);
    expect(r?.node?.id).toEqual(id);
  };

  test("simple", () => {
    expectOffset(6, "$/array");
    expectOffset(20, "$/array/0");
    expectOffset(43, "$/array/1");
  });

  test("corner", () => {
    expectOffset(0, undefined);
    expectOffset(2, "$");
    expectOffset(9, "$/array");
    expectOffset(10, "$/array");
    expectOffset(12, "$/array");
    expectOffset(13, "$/array/0");
    expectOffset(29, "$/array/0");
    expectOffset(31, "$/array");
    expectOffset(32, "$/array/1");
    expectOffset(52, "$/array/1");
    expectOffset(53, "$/array");
    expectOffset(54, "$");
    expectOffset(55, "$");
    expectOffset(56, undefined);
  });
});
