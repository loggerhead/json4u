import { genFlowNodes, Layouter } from "@/lib/graph/layout";
import { parseJSON } from "@/lib/parser/parse";

function checkNodes(jsonStr: string, nodeNum: number, edgeNum: number) {
  const tree = parseJSON(jsonStr);
  const { nodes, edges } = genFlowNodes(tree);
  expect(nodes.length).equals(nodeNum);
  expect(edges.length).equals(edgeNum);

  nodes.forEach((node) => {
    node.measured = { width: 200, height: 100 };
  });

  const { ordered, levelMeta } = new Layouter(tree, nodes, edges).layout();
  expect(ordered.length).equals(nodeNum);
  expect(levelMeta.length).greaterThan(0);
}

describe("genFlowNodes", () => {
  test("value", () => {
    checkNodes("6", 1, 0);
  });

  test("empty object", () => {
    checkNodes("{}", 1, 0);
  });

  test("empty array", () => {
    checkNodes("[]", 1, 0);
  });

  test("simple object", () => {
    checkNodes(
      `{
  "int64": 12345678987654321,
  "key": "value",
}`,
      1,
      0,
    );
  });

  test("object inside object", () => {
    checkNodes(
      `{
  "int64": 12345678987654321,
  "key": "value",
  "array": {"a": 1, "b": 2}
}`,
      2,
      1,
    );
  });

  test("array inside object", () => {
    checkNodes(
      `{
  "int64": 12345678987654321,
  "key": "value",
  "array": [12345678987654321, 0.1234567891111111111]
}`,
      2,
      1,
    );
  });

  test("simple array", () => {
    checkNodes("[12345678987654321, 0.1234567891111111111]", 1, 0);
  });

  test("object inside array", () => {
    checkNodes('[{"a": 1}, {"b": 2}]', 3, 2);
  });

  test("array inside array", () => {
    checkNodes("[[1, 1], [2, 2]]", 3, 2);
  });
});
