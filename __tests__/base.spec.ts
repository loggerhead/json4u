import * as fs from "fs";
import * as path from "path";
import * as jsonMap from "json-map-ts";
import TraceRecord from "../src/utils/trace";
import * as diff from "../src/utils/diff";

describe("json compare", () => {
  test("no difference", () => {
    const tt: [string, string][] = [
      read("naughty", "naughty"),
      [`{}`, `{\r\n\t}`],
      [
        `{"foo": 1, "bar": 2}`,
        `{
           "bar": 2,
           "foo": 1
         }`,
      ],
      [
        `{
          "bar": [2],
          "foo": 1
        }`,
        `{
          "foo": 1,
          "bar": [
            2
          ]
        }`,
      ],
    ];

    for (const t of tt) {
      expect(compare(...t).length).toEqual(0);
    }
  });

  test("simple diff", () => {
    compareDiffs([
      [
        `{}`,
        `[]`,
        [
          [
            { line: 1, pointer: "", diffType: diff.UNEQ, charDiffs: [] },
            { line: 1, pointer: "", diffType: diff.UNEQ, charDiffs: [] },
          ],
        ],
      ],
    ]);
  });

  test("special json pointer", () => {
    const [ltext, rtext] = [`{}`, `{"": 1}`];
    const dd = compare(ltext, rtext);
    console.log(dd);
    expect(dd).toMatchObject([
      [
        { line: 1, pointer: "", diffType: diff.MISS },
        { line: 2, pointer: "/", diffType: diff.MORE },
      ],
    ]);
  });

  function compareDiffs(tt: [string, string, diff.DiffPair[]][]) {
    for (const t of tt) {
      expect(compare(t[0], t[1])).toStrictEqual(t[2]);
    }
  }
});

function compare(ltext: string, rtext: string): [diff.Diff, diff.Diff][] {
  let ltrace = new TraceRecord(ltext);
  let rtrace = new TraceRecord(rtext);
  ltrace.setParseResult(jsonMap.parse(ltrace.out));
  rtrace.setParseResult(jsonMap.parse(rtrace.out));
  return new diff.Handler(ltrace, rtrace).compare();
}

function read(lname: string, rname: string): [string, string] {
  const lpath = path.resolve(__dirname, `./data/${lname}.json`);
  const rpath = path.resolve(__dirname, `./data/${rname}.json`);
  return [fs.readFileSync(lpath, "utf8"), fs.readFileSync(rpath, "utf8")];
}
