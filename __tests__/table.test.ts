import { parseJSON } from "@/lib/parser/parse";
import { genDomString } from "@/lib/table";

function checkDom(jsonStr: string, expectDomStr: string) {
  const tree = parseJSON(jsonStr);
  const domStr = genDomString(tree);
  expect(compareDOMStrings(domStr, expectDomStr), domStr).equals("");
}

function compareDOMStrings(str1: string, str2: string) {
  const parser = new DOMParser();
  const doc1 = parser.parseFromString(str1, "text/html");
  const doc2 = parser.parseFromString(str2, "text/html");
  return areNodesEqual(doc1.documentElement, doc2.documentElement);
}

function areNodesEqual(nodeA: Element, nodeB: Element): string {
  // 比较节点类型
  if (nodeA.nodeType !== nodeB.nodeType) {
    return `${nodeA.nodeType} ${nodeB.nodeType}`;
  }

  // 比较节点名称
  if (nodeA.nodeName !== nodeB.nodeName) {
    return `${nodeA.nodeName} ${nodeB.nodeName}`;
  }

  // 比较子节点
  const childrenA = nodeA.children;
  const childrenB = nodeB.children;

  if (childrenA.length !== childrenB.length) {
    return `${childrenA.length} ${childrenB.length}`;
  }

  for (let i = 0; i < childrenA.length; i++) {
    const reason = areNodesEqual(childrenA[i], childrenB[i]);
    if (reason) {
      return reason;
    }
  }

  return "";
}

describe("genFlowNodes", () => {
  test("value", () => {
    checkDom("6", "<span>6</span>");
  });

  test("empty object", () => {
    checkDom("{}", "<span>{}</span>");
  });

  test("empty array", () => {
    checkDom("[]", "<span>[]</span>");
  });

  test("simple object", () => {
    checkDom(
      `{
  "int64": 12345678987654321,
  "key": "value"
}`,
      `<table>
  <tbody>
    <tr>
      <th><div><span><span>int64</span></span></div></th>
      <td><span>12345678987654321</span></td>
    </tr>
    <tr>
      <th><div><span><span>key</span></span></div></th>
      <td><span>value</span></td>
    </tr>
  </tbody>
</table>
`,
    );
  });

  test("object inside object", () => {
    checkDom(
      `{
  "int64": 12345678987654321,
  "key": "value",
  "array": {"a": 1, "b": 2}
}`,
      `<table>
  <tbody>
    <tr>
      <th><div><span><span>int64</span></span></div></th>
      <td><span>12345678987654321</span></td>
    </tr>
    <tr>
      <th><div><span><span>key</span></span></div></th>
      <td><span>value</span></td>
    </tr>
    <tr>
      <th><div><span><span>array</span><span>{2}</span></span><div id="exp$/array"></div></div></th>
      <td>
        <table>
          <tbody>
            <tr>
              <th><div><span><span>a</span></span></div></th>
              <td><span>1</span></td>
            </tr>
            <tr>
              <th><div><span><span>b</span></span></div></th>
              <td><span>2</span></td>
            </tr>
          </tbody>
        </table>
      </td>
    </tr>
  </tbody>
</table>`,
    );
  });

  test("array inside object", () => {
    checkDom(
      `{
  "int64": 12345678987654321,
  "key": "value",
  "array": [12345678987654321, 0.1234567891111111111]
}`,
      `<table>
<tbody>
  <tr>
    <th><div><span><span>int64</span></span></div></th>
    <td><span>12345678987654321</span></td>
  </tr>
  <tr>
    <th><div><span><span>key</span></span></div></th>
    <td><span>value</span></td>
  </tr>
  <tr>
    <th>
      <div>
        <span><span>array</span><span>[2]</span></span>
        <div id="exp$/array"></div>
      </div>
    </th>
    <td>
      <table>
        <tbody>
          <tr><td><span>0</span><span>12345678987654321</span></td></tr>
          <tr><td><span>1</span><span>0.1234567891111111111</span></td></tr>
        </tbody>
      </table>
    </td>
  </tr>
</tbody>
</table>`,
    );
  });

  test("simple array", () => {
    checkDom(
      "[12345678987654321, 0.1234567891111111111]",
      `<table>
  <tbody>
    <tr><td><span>0</span><span>12345678987654321</span></td></tr>
    <tr><td><span>1</span><span>0.1234567891111111111</span></td></tr>
  </tbody>
</table>`,
    );
  });

  test("object inside array", () => {
    checkDom(
      '[{"a": 1}, {"b": 2}]',
      `
<table>
  <tbody>
    <tr>
      <th><div><span><span>a</span></span></div></th>
      <th><div><span><span>b</span></span></div></th>
    </tr>
    <tr>
      <td><span>1</span></td>
      <td><span>miss</span></td>
    </tr>
    <tr>
      <td><span>miss</span></td>
      <td><span>2</span></td>
    </tr>
  </tbody>
</table>
`,
    );
  });

  test("array inside array", () => {
    checkDom(
      "[[11, 12], [23, 24]]",
      `
<table>
  <tbody>
    <tr>
      <th><div><span><span>0</span></span></div></th>
      <th><div><span><span>1</span></span></div></th>
    </tr>
    <tr>
      <td><span>11</span></td>
      <td><span>12</span></td>
    </tr>
    <tr>
      <td><span>23</span></td>
      <td><span>24</span></td>
    </tr>
  </tbody>
</table>
`,
    );
  });
});
