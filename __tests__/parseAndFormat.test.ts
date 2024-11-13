import { getParentId, splitParentPointer } from "@/lib/idgen";
import { getRawValue, ParseOptions, Tree } from "@/lib/parser";
import { parseAndFormat } from "@/lib/worker/command/parse";
import { readFileIfNeed } from "./utils";

interface TestData {
  id: string;
  offset: number;
  length: number;
  boundOffset: number;
  boundLength: number;
}

async function doExpect(options: Partial<ParseOptions>, text: string, ...aa: TestData[]) {
  const { treeObject } = await parseAndFormat(text, {
    ...options,
    kind: "main",
  });
  const tree = Tree.fromObject(treeObject);

  expect(tree.hasError()).toEqual(false);
  expectOffsetAndText(tree, aa);
  expectFindNodeAtOffset(tree, aa);
}

function expectOffsetAndText(tree: Tree, aa: TestData[]) {
  for (const { id, offset, length, boundOffset, boundLength } of aa) {
    const node = tree.node(id);
    expect(node).toMatchObject({ offset, length, boundOffset, boundLength });

    const { parent: parentId, lastKey } = splitParentPointer(id);
    const parent = (parentId && tree.node(parentId)) || undefined;
    const valueText = getRawValue(node) ?? tree.text.slice(offset, offset + length);
    const boundText = tree.text.slice(boundOffset, boundOffset + boundLength);

    if (parent?.type === "object") {
      expect(boundText.startsWith(`"${lastKey}"`)).toEqual(true);
      expect(boundText.endsWith(valueText)).toEqual(true);
    } else {
      expect(boundText).toEqual(valueText);
    }
  }
}

function expectFindNodeAtOffset(tree: Tree, aa: TestData[]) {
  for (const { id, offset, length, boundOffset, boundLength } of aa) {
    {
      const r = tree.findNodeAtOffset(boundOffset);
      const parentId = getParentId(id);
      expect(r?.node?.id).toEqual(parentId);
    }
    {
      const r = tree.findNodeAtOffset(boundOffset + boundLength);
      expect(r?.node?.id).toEqual(id);
    }
    {
      const r = tree.findNodeAtOffset(offset + 1);
      expect(r?.node?.id).toEqual(id);
    }
  }
}

describe("check offset and boundOffset of parseAndFormat", () => {
  test("literal value", async () => {
    await doExpect({}, "   12345 ", { id: "$", offset: 3, length: 5, boundOffset: 3, boundLength: 5 });
    await doExpect({}, '   "234" ', { id: "$", offset: 3, length: 5, boundOffset: 3, boundLength: 5 });
    await doExpect({}, "   false ", { id: "$", offset: 3, length: 5, boundOffset: 3, boundLength: 5 });
    await doExpect({ format: true }, "   12345 ", {
      id: "$",
      offset: 0,
      length: 5,
      boundOffset: 0,
      boundLength: 5,
    });
    await doExpect({ format: true }, '   "234" ', {
      id: "$",
      offset: 0,
      length: 5,
      boundOffset: 0,
      boundLength: 5,
    });
    await doExpect({ format: true }, "   false ", {
      id: "$",
      offset: 0,
      length: 5,
      boundOffset: 0,
      boundLength: 5,
    });
  });

  test("object", async () => {
    await doExpect(
      {},
      readFileIfNeed("compare_data2.txt"),
      { id: "$/Aidan%20Gillen/string", offset: 126, length: 13, boundOffset: 116, boundLength: 23 },
      { id: "$/Aidan%20Gillen/array/1", offset: 86, length: 10, boundOffset: 86, boundLength: 10 },
    );
    await doExpect(
      { format: true },
      readFileIfNeed("compare_data2.txt"),
      { id: "$/Aidan%20Gillen/string", offset: 100, length: 13, boundOffset: 90, boundLength: 23 },
      { id: "$/Aidan%20Gillen/array/1", offset: 68, length: 10, boundOffset: 68, boundLength: 10 },
    );
    await doExpect(
      { format: "minify" },
      readFileIfNeed("compare_data2.txt"),
      { id: "$/Aidan%20Gillen/string", offset: 65, length: 13, boundOffset: 56, boundLength: 22 },
      { id: "$/Aidan%20Gillen/array/1", offset: 44, length: 10, boundOffset: 44, boundLength: 10 },
    );
  });

  test("nest parse", async () => {
    await doExpect(
      { nest: true },
      readFileIfNeed("nest.txt"),
      { id: "$/b/bb/ccc", offset: 45, length: 3, boundOffset: 39, boundLength: 9 },
      { id: "$/c", offset: 57, length: 5, boundOffset: 52, boundLength: 10 },
    );
    await doExpect(
      { nest: true, format: true },
      readFileIfNeed("nest.txt"),
      { id: "$/b/bb/ccc", offset: 85, length: 3, boundOffset: 78, boundLength: 10 },
      { id: "$/c", offset: 107, length: 5, boundOffset: 102, boundLength: 10 },
    );
    await doExpect(
      { nest: true, format: "minify" },
      readFileIfNeed("nest.txt"),
      { id: "$/b/bb/ccc", offset: 41, length: 3, boundOffset: 35, boundLength: 9 },
      { id: "$/c", offset: 51, length: 5, boundOffset: 47, boundLength: 9 },
    );
  });

  test("complex", async () => {
    await doExpect(
      { format: true },
      readFileIfNeed("complex.txt"),
      {
        id: "$/we___are___such___stuff___as___dreams___are___made___on___and___our___little___life___is___rounded___with___sleep/0",
        offset: 285,
        length: 714,
        boundOffset: 285,
        boundLength: 714,
      },
      {
        id: "$/we___are___such___stuff___as___dreams___are___made___on___and___our___little___life___is___rounded___with___sleep/0/index",
        offset: 302,
        length: 1,
        boundOffset: 293,
        boundLength: 10,
      },
    );
    await doExpect(
      { format: "minify" },
      readFileIfNeed("complex.txt"),
      {
        id: "$/we___are___such___stuff___as___dreams___are___made___on___and___our___little___life___is___rounded___with___sleep/0",
        offset: 247,
        length: 463,
        boundOffset: 247,
        boundLength: 463,
      },
      {
        id: "$/we___are___such___stuff___as___dreams___are___made___on___and___our___little___life___is___rounded___with___sleep/0/index",
        offset: 256,
        length: 1,
        boundOffset: 248,
        boundLength: 9,
      },
    );
    await doExpect(
      { nest: true },
      readFileIfNeed("complex.txt"),
      {
        id: "$/we___are___such___stuff___as___dreams___are___made___on___and___our___little___life___is___rounded___with___sleep/0",
        offset: 285,
        length: 692,
        boundOffset: 285,
        boundLength: 692,
      },
      {
        id: "$/we___are___such___stuff___as___dreams___are___made___on___and___our___little___life___is___rounded___with___sleep/0/index",
        offset: 302,
        length: 1,
        boundOffset: 293,
        boundLength: 10,
      },
    );
  });
});
