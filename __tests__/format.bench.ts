import { textFormat } from "@/lib/format/text";
import { parseJSON } from "@/lib/parser";
import { readFile } from "fs/promises";
import { bench, describe } from "vitest";

const jsonString = await readFile(`${__dirname}/fixtures/complex.txt`, "utf8");
const tree = parseJSON(jsonString);

describe("format", () => {
  assert(!tree.hasError(), "parse tree failed");

  bench("pretty", () => {
    tree.stringify();
  });

  bench("simple", () => {
    textFormat(jsonString);
  });
});
