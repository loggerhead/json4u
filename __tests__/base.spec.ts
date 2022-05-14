import * as fs from "fs";
import * as path from "path";
import * as jsonMap from "json-map-ts";
import formatJsonString from "../src/utils/format";
import TraceRecord from "../src/utils/trace";
import * as diff from "../src/utils/diff";

describe("line compare", () => {
  test("no difference", () => {
    const tt: [string, string][] = [
      [read("naughty"), read("naughty")],
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
      expect(formatAndCompare(...t).length).toEqual(0);
    }
  });

  test("simple diff", () => {
    compareDiffs(`{}`, `[]`, gen(1));
    compareDiffs(`{ "akey": [] }`, `{ "akey": null }`, gen(2));
    compareDiffs(`{ "akey": {} }`, `{ "akey": null }`, gen(2));
    compareDiffs(`{ "akey": null }`, `{ "akey": [] }`, gen(2));
    compareDiffs(`{ "akey": null }`, `{ "akey": {} }`, gen(2));
    compareDiffs(
      `{"link": "<a href=\\\"http://google.com/\\\">Google</a>"}`,
      `{"link": "<a href=\\\"http://googlex.com/\\\">Google</a>"}`,
      gen(2)
    );
    compareDiffs(
      `{"editor.detectIndentation": false,"editor.tabSize": 2,"files.exclude": {".vscode/": true,"foo": "bar"}}`,
      `{"editor.detectIndentation": false,"editor.tabSize": 2,"files.exclude": {".slash/": true,"foo": "bar"}}`,
      gen(5)
    );
    compareDiffs(
      `{"editor.detectIndentation": false,"editor.tabSize": 2,"files.exclude": {"bas":".vscode/","foo": "bar"}}`,
      `{"editor.detectIndentation": false,"editor.tabSize": 2,"files.exclude": {"bas":".slash/","foo": "bar"}}`,
      gen(5)
    );
    compareDiffs(
      `{"newline": "a\\nb","slash": "a\\\\b","quotes": "a\\"b","backspace": "a\\bb","formfeed": "a\\fb","carriagereturn": "a\\rb","tab": "a\\tb","a\\nb": "newline","a\\\\b": "slash","a\\"b": "quotes","a\\bb": "backspace","a\\fb": "formfeed","a\\rb": "carriagereturn","a\\tb": "tab"}`,
      `{"newline": "a\\nbx","slash": "a\\\\bx","quotes": "a\\"bx","backspace": "a\\bbx","formfeed": "a\\fbx","carriagereturn": "a\\rbx","tab": "a\\tbx","a\\nb": "newline","a\\\\bx": "slash","a\\"bx": "quotes","a\\bbx": "backspace","a\\fbx": "formfeed","a\\rbx": "carriagereturn","a\\tbx": "tab"}`,
      gen(2, 3, 4, 5, 6, 7, 8, 10, 11, 12, 13, 14, 15)
    );

    compareDiffs(
      `[{  "OBJ_ID": "CN=Kate Smith,OU=Users,OU=Willow,DC=cloudaddc,DC=qalab,DC=cam,DC=novell,DC=com",  "userAccountControl": "512",  "objectGUID": "b3067a77-875b-4208-9ee3-39128adeb654",  "lastLogon": "0",  "sAMAccountName": "ksmith",  "userPrincipalName": "ksmith@cloudaddc.qalab.cam.novell.com",  "distinguishedName": "CN=Kate Smith,OU=Users,OU=Willow,DC=cloudaddc,DC=qalab,DC=cam,DC=novell,DC=com"},{  "OBJ_ID": "CN=Timothy Swan,OU=Users,OU=Willow,DC=cloudaddc,DC=qalab,DC=cam,DC=novell,DC=com",  "userAccountControl": "512",  "objectGUID": "c3f7dae9-9b4f-4d55-a1ec-bf9ef45061c3",  "lastLogon": "130766915788304915",  "sAMAccountName": "tswan",  "userPrincipalName": "tswan@cloudaddc.qalab.cam.novell.com",  "distinguishedName": "CN=Timothy Swan,OU=Users,OU=Willow,DC=cloudaddc,DC=qalab,DC=cam,DC=novell,DC=com"}]`,
      `{"foo":[{  "OBJ_ID": "CN=Timothy Swan,OU=Users,OU=Willow,DC=cloudaddc,DC=qalab,DC=cam,DC=novell,DC=com",  "userAccountControl": "512",  "objectGUID": "c3f7dae9-9b4f-4d55-a1ec-bf9ef45061c3",  "lastLogon": "130766915788304915",  "sAMAccountName": "tswan",  "userPrincipalName": "tswan@cloudaddc.qalab.cam.novell.com",  "distinguishedName": "CN=Timothy Swan,OU=Users,OU=Willow,DC=cloudaddc,DC=qalab,DC=cam,DC=novell,DC=com"}]}`,
      gen(1)
    );

    compareDiffs(
      `{"foo":[{  "OBJ_ID": "CN=Kate Smith,OU=Users,OU=Willow,DC=cloudaddc,DC=qalab,DC=cam,DC=novell,DC=com",  "userAccountControl": "512",  "objectGUID": "b3067a77-875b-4208-9ee3-39128adeb654",  "lastLogon": "0",  "sAMAccountName": "ksmith",  "userPrincipalName": "ksmith@cloudaddc.qalab.cam.novell.com",  "distinguishedName": "CN=Kate Smith,OU=Users,OU=Willow,DC=cloudaddc,DC=qalab,DC=cam,DC=novell,DC=com"},{  "OBJ_ID": "CN=Timothy Swan,OU=Users,OU=Willow,DC=cloudaddc,DC=qalab,DC=cam,DC=novell,DC=com",  "userAccountControl": "512",  "objectGUID": "c3f7dae9-9b4f-4d55-a1ec-bf9ef45061c3",  "lastLogon": "130766915788304915",  "sAMAccountName": "tswan",  "userPrincipalName": "tswan@cloudaddc.qalab.cam.novell.com",  "distinguishedName": "CN=Timothy Swan,OU=Users,OU=Willow,DC=cloudaddc,DC=qalab,DC=cam,DC=novell,DC=com"}]}`,
      `[{  "OBJ_ID": "CN=Timothy Swan,OU=Users,OU=Willow,DC=cloudaddc,DC=qalab,DC=cam,DC=novell,DC=com",  "userAccountControl": "512",  "objectGUID": "c3f7dae9-9b4f-4d55-a1ec-bf9ef45061c3",  "lastLogon": "130766915788304915",  "sAMAccountName": "tswan",  "userPrincipalName": "tswan@cloudaddc.qalab.cam.novell.com",  "distinguishedName": "CN=Timothy Swan,OU=Users,OU=Willow,DC=cloudaddc,DC=qalab,DC=cam,DC=novell,DC=com"}]`,
      gen(1)
    );
  });

  test("object compare", () => {
    compareDiffs(
      `{"Aidan Gillen": {"array": ["Game of Thron\\"es","The Wire"],"string": "some string","int": 2,"aboolean": true, "boolean": true, "null": null, "a_null": null, "another_null": "null check", "object": {"foo": "bar","object1": {"new prop1": "new prop value"},"object2": {"new prop1": "new prop value"},"object3": {"new prop1": "new prop value"},"object4": {"new prop1": "new prop value"}}},"Amy Ryan": {"one": "In Treatment","two": "The Wire"},"Annie Fitzgerald": ["Big Love","True Blood"],"Anwan Glover": ["Treme","The Wire"],"Alexander Skarsgard": ["Generation Kill","True Blood"], "Clarke Peters": null}`,
      `{"Aidan Gillen": {"array": ["Game of Thrones","The Wire"],"string": "some string","int": "2","otherint": 4, "aboolean": "true", "boolean": false, "null": null, "a_null":88, "another_null": null, "object": {"foo": "bar"}},"Amy Ryan": ["In Treatment","The Wire"],"Annie Fitzgerald": ["True Blood","Big Love","The Sopranos","Oz"],"Anwan Glover": ["Treme","The Wire"],"Alexander Skarsg?rd": ["Generation Kill","True Blood"],"Alice Farmer": ["The Corner","Oz","The Wire"]}`,
      [
        [
          { index: 46, pointer: "/Clarke Peters", diffType: diff.DEL },
          { index: 1, pointer: "", diffType: diff.NONE },
        ],
        [
          { index: 4, pointer: "/Aidan Gillen/array/0", diffType: diff.DEL },
          { index: 4, pointer: "/Aidan Gillen/array/0", diffType: diff.INS },
        ],
        [
          { index: 8, pointer: "/Aidan Gillen/int", diffType: diff.DEL },
          { index: 8, pointer: "/Aidan Gillen/int", diffType: diff.INS },
        ],
        [
          { index: 2, pointer: "/Aidan Gillen", diffType: diff.NONE },
          { index: 9, pointer: "/Aidan Gillen/otherint", diffType: diff.INS },
        ],
        [
          { index: 9, pointer: "/Aidan Gillen/aboolean", diffType: diff.DEL },
          { index: 10, pointer: "/Aidan Gillen/aboolean", diffType: diff.INS },
        ],
        [
          { index: 10, pointer: "/Aidan Gillen/boolean", diffType: diff.DEL },
          { index: 11, pointer: "/Aidan Gillen/boolean", diffType: diff.INS },
        ],
        [
          { index: 12, pointer: "/Aidan Gillen/a_null", diffType: diff.DEL },
          { index: 13, pointer: "/Aidan Gillen/a_null", diffType: diff.INS },
        ],
        [
          { index: 13, pointer: "/Aidan Gillen/another_null", diffType: diff.DEL },
          { index: 14, pointer: "/Aidan Gillen/another_null", diffType: diff.INS },
        ],
        [
          { index: 16, pointer: "/Aidan Gillen/object/object1", diffType: diff.DEL },
          { index: 15, pointer: "/Aidan Gillen/object", diffType: diff.NONE },
        ],
        [
          { index: 19, pointer: "/Aidan Gillen/object/object2", diffType: diff.DEL },
          { index: 15, pointer: "/Aidan Gillen/object", diffType: diff.NONE },
        ],
        [
          { index: 22, pointer: "/Aidan Gillen/object/object3", diffType: diff.DEL },
          { index: 15, pointer: "/Aidan Gillen/object", diffType: diff.NONE },
        ],
        [
          { index: 25, pointer: "/Aidan Gillen/object/object4", diffType: diff.DEL },
          { index: 15, pointer: "/Aidan Gillen/object", diffType: diff.NONE },
        ],
        [
          { index: 30, pointer: "/Amy Ryan", diffType: diff.DEL },
          { index: 19, pointer: "/Amy Ryan", diffType: diff.INS },
        ],
        [
          { index: 36, pointer: "/Annie Fitzgerald/1", diffType: diff.DEL },
          { index: 23, pointer: "/Annie Fitzgerald", diffType: diff.NONE },
        ],
        [
          { index: 34, pointer: "/Annie Fitzgerald", diffType: diff.NONE },
          { index: 24, pointer: "/Annie Fitzgerald/0", diffType: diff.INS },
        ],
        [
          { index: 34, pointer: "/Annie Fitzgerald", diffType: diff.NONE },
          { index: 26, pointer: "/Annie Fitzgerald/2", diffType: diff.INS },
        ],
        [
          { index: 34, pointer: "/Annie Fitzgerald", diffType: diff.NONE },
          { index: 27, pointer: "/Annie Fitzgerald/3", diffType: diff.INS },
        ],
        [
          { index: 42, pointer: "/Alexander Skarsgard", diffType: diff.DEL },
          { index: 33, pointer: "/Alexander Skarsg?rd", diffType: diff.INS },
        ],
        [
          { index: 1, pointer: "", diffType: diff.NONE },
          { index: 37, pointer: "/Alice Farmer", diffType: diff.INS },
        ],
      ]
    );
  });

  test("array compare", () => {
    compareDiffs(
      `[{  "OBJ_ID": "CN=Kate Smith,OU=Users,OU=Willow,DC=cloudaddc,DC=qalab,DC=cam,DC=novell,DC=com",  "userAccountControl": "512",  "objectGUID": "b3067a77-875b-4208-9ee3-39128adeb654",  "lastLogon": "0",  "sAMAccountName": "ksmith",  "userPrincipalName": "ksmith@cloudaddc.qalab.cam.novell.com",  "distinguishedName": "CN=Kate Smith,OU=Users,OU=Willow,DC=cloudaddc,DC=qalab,DC=cam,DC=novell,DC=com"},{  "OBJ_ID": "CN=Timothy Swan,OU=Users,OU=Willow,DC=cloudaddc,DC=qalab,DC=cam,DC=novell,DC=com",  "userAccountControl": "512",  "objectGUID": "c3f7dae9-9b4f-4d55-a1ec-bf9ef45061c3",  "lastLogon": "130766915788304915",  "sAMAccountName": "tswan",  "userPrincipalName": "tswan@cloudaddc.qalab.cam.novell.com",  "distinguishedName": "CN=Timothy Swan,OU=Users,OU=Willow,DC=cloudaddc,DC=qalab,DC=cam,DC=novell,DC=com"}]`,
      `[{  "OBJ_ID": "CN=Timothy Swan,OU=Users,OU=Willow,DC=cloudaddc,DC=qalab,DC=cam,DC=novell,DC=com",  "userAccountControl": "512",  "objectGUID": "c3f7dae9-9b4f-4d55-a1ec-bf9ef45061c3",  "lastLogon": "130766915788304915",  "sAMAccountName": "tswan",  "userPrincipalName": "tswan@cloudaddc.qalab.cam.novell.com",  "distinguishedName": "CN=Timothy Swan,OU=Users,OU=Willow,DC=cloudaddc,DC=qalab,DC=cam,DC=novell,DC=com"}]`,
      [
        [
          { index: 2, pointer: "/0", diffType: diff.DEL, charDiffs: [] },
          { index: 1, pointer: "", diffType: diff.NONE, charDiffs: [] },
        ],
      ]
    );
  });

  test("naughty", () => {
    compareDiffs(read("naughty"), read("naughty.right"), gen(133, 161, 174, 176, 191));
  });
});

describe("char-by-char compare", () => {
  test("key difference", () => {
    compareDiffs(`{"foo": 1}`, `{"foz": 1}`, [
      [
        { index: 2, pointer: "/foo", diffType: diff.DEL, charDiffs: [{ diffType: diff.PART_DEL, start: 7, end: 8 }] },
        { index: 2, pointer: "/foz", diffType: diff.INS, charDiffs: [{ diffType: diff.PART_INS, start: 7, end: 8 }] },
      ],
    ]);
  });

  test("key difference with equal object value", () => {
    compareDiffs(`[123, {"foo": {"": 1}}]`, `[123, {"foz": {"": 1}}]`, [
      [
        {
          index: 4,
          pointer: "/1/foo",
          diffType: diff.DEL,
          charDiffs: [{ diffType: diff.PART_DEL, start: 11, end: 12 }],
        },
        {
          index: 4,
          pointer: "/1/foz",
          diffType: diff.INS,
          charDiffs: [{ diffType: diff.PART_INS, start: 11, end: 12 }],
        },
      ],
    ]);
  });

  test("key difference with equal array value", () => {
    compareDiffs(`[123, {"foo": [1]}]`, `[123, {"foz": [1]}]`, [
      [
        {
          index: 4,
          pointer: "/1/foo",
          diffType: diff.DEL,
          charDiffs: [{ diffType: diff.PART_DEL, start: 11, end: 12 }],
        },
        {
          index: 4,
          pointer: "/1/foz",
          diffType: diff.INS,
          charDiffs: [{ diffType: diff.PART_INS, start: 11, end: 12 }],
        },
      ],
    ]);
  });

  test("value difference", () => {
    compareDiffs(`{"foo": 123}`, `{"foo": 231}`, [
      [
        { index: 2, pointer: "/foo", diffType: diff.DEL, charDiffs: [{ diffType: diff.PART_DEL, start: 11, end: 12 }] },
        { index: 2, pointer: "/foo", diffType: diff.INS, charDiffs: [{ diffType: diff.PART_INS, start: 13, end: 14 }] },
      ],
    ]);
  });

  test("value difference of bigint", () => {
    compareDiffs(`{"foo": 18446744073709551615}`, `{"foo": 18446744073709551611}`, [
      [
        { index: 2, pointer: "/foo", diffType: diff.DEL, charDiffs: [{ diffType: diff.PART_DEL, start: 30, end: 31 }] },
        { index: 2, pointer: "/foo", diffType: diff.INS, charDiffs: [{ diffType: diff.PART_INS, start: 30, end: 31 }] },
      ],
    ]);
  });

  test("value difference of array", () => {
    compareDiffs(`[{"foo": [123]}]`, `[{"foo": [231]}]`, [
      [
        {
          index: 4,
          pointer: "/0/foo/0",
          diffType: diff.DEL,
          charDiffs: [{ diffType: diff.PART_DEL, start: 12, end: 13 }],
        },
        {
          index: 4,
          pointer: "/0/foo/0",
          diffType: diff.INS,
          charDiffs: [{ diffType: diff.PART_INS, start: 14, end: 15 }],
        },
      ],
    ]);
  });

  test("value difference of Arabic", () => {
    const l = `[
      { "value": "1 day" },
      { "value": "د.ك 0 / د.ك 2" },
      { }
    ]`;

    const r = `[
      { "value": "--" },
      { "value": "KD 0 / KD 2" },
      { }
    ]`;

    compareDiffs(l, r, [
      [
        {
          index: 3,
          pointer: "/0/value",
          diffType: diff.DEL,
          charDiffs: [{ diffType: diff.PART_DEL, start: 18, end: 23 }],
        },
        {
          index: 3,
          pointer: "/0/value",
          diffType: diff.INS,
          charDiffs: [{ diffType: diff.PART_INS, start: 18, end: 20 }],
        },
      ],
      [
        {
          index: 6,
          pointer: "/1/value",
          diffType: diff.DEL,
          charDiffs: [
            { diffType: diff.PART_DEL, start: 18, end: 21 },
            { diffType: diff.PART_DEL, start: 26, end: 29 },
          ],
        },
        {
          index: 6,
          pointer: "/1/value",
          diffType: diff.INS,
          charDiffs: [
            { diffType: diff.PART_INS, start: 18, end: 20 },
            { diffType: diff.PART_INS, start: 25, end: 27 },
          ],
        },
      ],
    ]);
  });
});

describe("json pointer", () => {
  test("simple json pointer", () => {
    compareDiffs(`{}`, `{"": 1}`, [
      [
        { index: 1, pointer: "", diffType: diff.NONE },
        { index: 2, pointer: "/", diffType: diff.INS },
      ],
    ]);

    compareDiffs(`[]`, `[1]`, [
      [
        { index: 1, pointer: "", diffType: diff.NONE },
        { index: 2, pointer: "/0", diffType: diff.INS },
      ],
    ]);

    compareDiffs(`{}`, `{"0": 1}`, [
      [
        { index: 1, pointer: "", diffType: diff.NONE },
        { index: 2, pointer: "/0", diffType: diff.INS },
      ],
    ]);
  });

  test("specific chars", () => {
    // escape '~' as '~0'
    compareDiffs(`{"~": 1}`, `{"~0": 1}`, [
      [
        { index: 2, pointer: "/~0", diffType: diff.DEL },
        { index: 2, pointer: "/~00", diffType: diff.INS },
      ],
    ]);

    // escape '/' as '~1'
    compareDiffs(`{"/": 1}`, `{"~1": 1}`, [
      [
        { index: 2, pointer: "/~1", diffType: diff.DEL },
        { index: 2, pointer: "/~01", diffType: diff.INS },
      ],
    ]);

    compareDiffs(`{"<>": 1}`, `{"\\\\": 1}`, [
      [
        { index: 2, pointer: "/<>", diffType: diff.DEL },
        { index: 2, pointer: "/\\", diffType: diff.INS },
      ],
    ]);
  });
});

describe("large json file", () => {
  test("large json file", () => {
    const ltext = read("large");
    const rtext = ltext.replace("测测", "测1下");
    expect(rtext.indexOf("测1下")).toBeGreaterThan(0);
    compareDiffs(ltext, rtext, gen(312));
  });
});

describe("text compare", () => {
  let l: string;
  let r: string;

  test("ignore blank difference", () => {
    l = `
// Cap returns v's capacity.
// It panics if v's Kind is not Array, Chan, or Slice.
func (v Value) Cap() int {
  // capNonSlice is split out to keep Cap inlineable for slice kinds.
  if v.kind() == Slice {
  @@ -1160,6 +1160,11 @@ func (v Value) capNonSlice() int {
    return v.typ.Len()
  case Chan:
    return chancap(v.pointer())
  }
  panic(&ValueError{"reflect.Value.Cap", v.kind()})
}`;

    r = `
// Cap returns v's capacity.
// It panics if v's Kind is not Array, Chan, Slice or pointer to Array.
func (v Value) Cap() int {
  // capNonSlice is split out to keep Cap inlineable for slice kinds.
  if v.kind() == Slice {
  @@ -1160,6 +1160,11 @@ func (v Value) capNonSlice() int {
    return v.typ.Len()
  case Chan:
    return chancap(v.pointer())
  case Ptr:
    if v.typ.Elem().Kind() == Array {
      return v.typ.Elem().Len()
    }
    panic("reflect: call of reflect.Value.Cap on ptr to non-array Value")
  }
  panic(&ValueError{"reflect.Value.Cap", v.kind()})
}`;

    assertTextCompare(l, r, [
      { index: 2, pointer: "", diffType: diff.DEL, charDiffs: [{ diffType: diff.PART_DEL, start: 45, end: 48 }] },
      { index: 2, pointer: "", diffType: diff.INS, charDiffs: [{ diffType: diff.PART_INS, start: 50, end: 70 }] },
      { index: 10, pointer: "", diffType: diff.INS, charDiffs: [] },
      { index: 11, pointer: "", diffType: diff.INS, charDiffs: [] },
      { index: 12, pointer: "", diffType: diff.INS, charDiffs: [] },
      { index: 13, pointer: "", diffType: diff.INS, charDiffs: [] },
      { index: 14, pointer: "", diffType: diff.INS, charDiffs: [] },
    ]);

    l = `
default:
  base: "change"
  minimum_coverage: 0%
  threshold: 0%
  paths:
    - "!main.go"
    - "!handler.go"
    - "!mock"`;
    r = `
default:
  threshold: 0%
  base: "change"
report:
  minimum_coverage: 0%
  paths:
    - "!main.go"
    - "!handler.go"`;
    assertTextCompare(l, r, [
      { index: 4, pointer: "", diffType: diff.DEL, charDiffs: [] },
      { index: 8, pointer: "", diffType: diff.DEL, charDiffs: [] },
      { index: 2, pointer: "", diffType: diff.INS, charDiffs: [] },
      { index: 4, pointer: "", diffType: diff.INS, charDiffs: [] },
    ]);
  });
});

function gen(...lines: number[]): any {
  let vv = [];
  for (const line of lines) {
    vv.push([
      { index: line, diffType: diff.DEL },
      { index: line, diffType: diff.INS },
    ]);
  }
  return vv;
}

function assertTextCompare(ltext: string, rtext: string, dd: diff.Diff[]) {
  const removeFirstLine = (text: string): string => {
    let lines = text.split("\n");
    lines.splice(0, 1);
    return lines.join("\n");
  };

  ltext = removeFirstLine(ltext);
  rtext = removeFirstLine(rtext);

  let ddPairs: diff.DiffPair[] = [];
  for (const d of dd) {
    if (d.diffType === diff.DEL) {
      ddPairs.push([d, undefined]);
    } else {
      ddPairs.push([undefined, d]);
    }
  }

  const results = diff.textCompare(ltext, rtext, true);
  expect(results.length).toEqual(ddPairs.length);
  expect(results.sort()).toMatchObject(ddPairs.sort());
}

function compareDiffs(ltext: string, rtext: string, dd: diff.DiffPair[]) {
  const results = formatAndCompare(ltext, rtext);
  expect(results.length).toEqual(dd.length);
  expect(results).toMatchObject(dd);
}

function formatAndCompare(ltext: string, rtext: string): diff.DiffPair[] {
  let ltrace = new TraceRecord(formatJsonString(ltext));
  let rtrace = new TraceRecord(formatJsonString(rtext));
  const lparseResult = jsonMap.parse(ltrace.out);
  const rparseResult = jsonMap.parse(rtrace.out);
  ltrace.setParseResult(lparseResult);
  rtrace.setParseResult(rparseResult);
  return new diff.Handler(ltrace, rtrace).compare();
}

function read(name: string): string {
  const filePath = path.resolve(__dirname, `./data/${name}.json`);
  return fs.readFileSync(filePath, "utf8");
}
