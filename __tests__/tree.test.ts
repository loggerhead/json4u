import { parseJSON } from "@/lib/parser/parse";

describe("findNodeAtOffset", () => {
  const tree = parseJSON('{ "array": [12345678987654321, 0.1234567891111111111] }');

  test("simple", () => {
    expect(tree.findNodeAtOffset(6)?.id).toEqual("$/array");
    expect(tree.findNodeAtOffset(20)?.id).toEqual("$/array/0");
    expect(tree.findNodeAtOffset(43)?.id).toEqual("$/array/1");
  });

  test("corner", () => {
    expect(tree.findNodeAtOffset(0)?.id).toEqual(undefined);
    expect(tree.findNodeAtOffset(2)?.id).toEqual("$");
    expect(tree.findNodeAtOffset(9)?.id).toEqual("$/array");
    expect(tree.findNodeAtOffset(10)?.id).toEqual("$/array");
    expect(tree.findNodeAtOffset(12)?.id).toEqual("$/array");
    expect(tree.findNodeAtOffset(13)?.id).toEqual("$/array/0");
    expect(tree.findNodeAtOffset(29)?.id).toEqual("$/array/0");
    expect(tree.findNodeAtOffset(31)?.id).toEqual("$/array");
    expect(tree.findNodeAtOffset(32)?.id).toEqual("$/array/1");
    expect(tree.findNodeAtOffset(52)?.id).toEqual("$/array/1");
    expect(tree.findNodeAtOffset(53)?.id).toEqual("$/array");
    expect(tree.findNodeAtOffset(54)?.id).toEqual("$");
    expect(tree.findNodeAtOffset(55)?.id).toEqual("$");
    expect(tree.findNodeAtOffset(56)?.id).toEqual(undefined);
  });
});
