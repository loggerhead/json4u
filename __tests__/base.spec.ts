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
          { line: 46, pointer: "/Clarke Peters", diffType: diff.MORE },
          { line: 1, pointer: "", diffType: diff.LESS },
        ],
        [
          { line: 4, pointer: "/Aidan Gillen/array/0", diffType: diff.NE },
          { line: 4, pointer: "/Aidan Gillen/array/0", diffType: diff.NE },
        ],
        [
          { line: 8, pointer: "/Aidan Gillen/int", diffType: diff.NE },
          { line: 8, pointer: "/Aidan Gillen/int", diffType: diff.NE },
        ],
        [
          { line: 2, pointer: "/Aidan Gillen", diffType: diff.LESS },
          { line: 9, pointer: "/Aidan Gillen/otherint", diffType: diff.MORE },
        ],
        [
          { line: 9, pointer: "/Aidan Gillen/aboolean", diffType: diff.NE },
          { line: 10, pointer: "/Aidan Gillen/aboolean", diffType: diff.NE },
        ],
        [
          { line: 10, pointer: "/Aidan Gillen/boolean", diffType: diff.NE },
          { line: 11, pointer: "/Aidan Gillen/boolean", diffType: diff.NE },
        ],
        [
          { line: 12, pointer: "/Aidan Gillen/a_null", diffType: diff.NE },
          { line: 13, pointer: "/Aidan Gillen/a_null", diffType: diff.NE },
        ],
        [
          { line: 13, pointer: "/Aidan Gillen/another_null", diffType: diff.NE },
          { line: 14, pointer: "/Aidan Gillen/another_null", diffType: diff.NE },
        ],
        [
          { line: 16, pointer: "/Aidan Gillen/object/object1", diffType: diff.MORE },
          { line: 15, pointer: "/Aidan Gillen/object", diffType: diff.LESS },
        ],
        [
          { line: 19, pointer: "/Aidan Gillen/object/object2", diffType: diff.MORE },
          { line: 15, pointer: "/Aidan Gillen/object", diffType: diff.LESS },
        ],
        [
          { line: 22, pointer: "/Aidan Gillen/object/object3", diffType: diff.MORE },
          { line: 15, pointer: "/Aidan Gillen/object", diffType: diff.LESS },
        ],
        [
          { line: 25, pointer: "/Aidan Gillen/object/object4", diffType: diff.MORE },
          { line: 15, pointer: "/Aidan Gillen/object", diffType: diff.LESS },
        ],
        [
          { line: 30, pointer: "/Amy Ryan", diffType: diff.NE },
          { line: 19, pointer: "/Amy Ryan", diffType: diff.NE },
        ],
        [
          { line: 35, pointer: "/Annie Fitzgerald/0", diffType: diff.NE },
          { line: 24, pointer: "/Annie Fitzgerald/0", diffType: diff.NE },
        ],
        [
          { line: 36, pointer: "/Annie Fitzgerald/1", diffType: diff.NE },
          { line: 25, pointer: "/Annie Fitzgerald/1", diffType: diff.NE },
        ],
        [
          { line: 34, pointer: "/Annie Fitzgerald", diffType: diff.LESS },
          { line: 26, pointer: "/Annie Fitzgerald/2", diffType: diff.MORE },
        ],
        [
          { line: 34, pointer: "/Annie Fitzgerald", diffType: diff.LESS },
          { line: 27, pointer: "/Annie Fitzgerald/3", diffType: diff.MORE },
        ],
        [
          { line: 42, pointer: "/Alexander Skarsgard", diffType: diff.NE },
          { line: 33, pointer: "/Alexander Skarsg?rd", diffType: diff.NE },
        ],
        [
          { line: 1, pointer: "", diffType: diff.LESS },
          { line: 37, pointer: "/Alice Farmer", diffType: diff.MORE },
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
          { line: 11, pointer: "/1", diffType: "more", charDiffs: [] },
          { line: 1, pointer: "", diffType: "less", charDiffs: [] },
        ],
        [
          { line: 3, pointer: "/0/OBJ_ID", diffType: diff.NE },
          { line: 3, pointer: "/0/OBJ_ID", diffType: diff.NE },
        ],
        [
          { line: 5, pointer: "/0/objectGUID", diffType: diff.NE },
          { line: 5, pointer: "/0/objectGUID", diffType: diff.NE },
        ],
        [
          { line: 6, pointer: "/0/lastLogon", diffType: diff.NE, charDiffs: [] },
          { line: 6, pointer: "/0/lastLogon", diffType: diff.NE },
        ],
        [
          { line: 7, pointer: "/0/sAMAccountName", diffType: diff.NE },
          { line: 7, pointer: "/0/sAMAccountName", diffType: diff.NE },
        ],
        [
          { line: 8, pointer: "/0/userPrincipalName", diffType: diff.NE },
          { line: 8, pointer: "/0/userPrincipalName", diffType: diff.NE },
        ],
        [
          { line: 9, pointer: "/0/distinguishedName", diffType: diff.NE },
          { line: 9, pointer: "/0/distinguishedName", diffType: diff.NE },
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
        { line: 2, pointer: "/foo", diffType: diff.NE, charDiffs: [{ diffType: diff.CHAR_DEL, start: 7, end: 8 }] },
        { line: 2, pointer: "/foz", diffType: diff.NE, charDiffs: [{ diffType: diff.CHAR_INS, start: 7, end: 8 }] },
      ],
    ]);
  });

  test("key difference with equal object value", () => {
    compareDiffs(`[123, {"foo": {"": 1}}]`, `[123, {"foz": {"": 1}}]`, [
      [
        { line: 4, pointer: "/1/foo", diffType: diff.NE, charDiffs: [{ diffType: diff.CHAR_DEL, start: 11, end: 12 }] },
        { line: 4, pointer: "/1/foz", diffType: diff.NE, charDiffs: [{ diffType: diff.CHAR_INS, start: 11, end: 12 }] },
      ],
    ]);
  });

  test("key difference with equal array value", () => {
    compareDiffs(`[123, {"foo": [1]}]`, `[123, {"foz": [1]}]`, [
      [
        { line: 4, pointer: "/1/foo", diffType: diff.NE, charDiffs: [{ diffType: diff.CHAR_DEL, start: 11, end: 12 }] },
        { line: 4, pointer: "/1/foz", diffType: diff.NE, charDiffs: [{ diffType: diff.CHAR_INS, start: 11, end: 12 }] },
      ],
    ]);
  });

  test("value difference", () => {
    compareDiffs(`{"foo": 123}`, `{"foo": 231}`, [
      [
        { line: 2, pointer: "/foo", diffType: diff.NE, charDiffs: [{ diffType: diff.CHAR_DEL, start: 11, end: 12 }] },
        { line: 2, pointer: "/foo", diffType: diff.NE, charDiffs: [{ diffType: diff.CHAR_INS, start: 13, end: 14 }] },
      ],
    ]);
  });

  test("value difference of bigint", () => {
    compareDiffs(`{"foo": 18446744073709551615}`, `{"foo": 18446744073709551611}`, [
      [
        { line: 2, pointer: "/foo", diffType: diff.NE, charDiffs: [{ diffType: diff.CHAR_DEL, start: 30, end: 31 }] },
        { line: 2, pointer: "/foo", diffType: diff.NE, charDiffs: [{ diffType: diff.CHAR_INS, start: 30, end: 31 }] },
      ],
    ]);
  });

  test("value difference of array", () => {
    compareDiffs(`[{"foo": [123]}]`, `[{"foo": [231]}]`, [
      [
        {
          line: 4,
          pointer: "/0/foo/0",
          diffType: diff.NE,
          charDiffs: [{ diffType: diff.CHAR_DEL, start: 12, end: 13 }],
        },
        {
          line: 4,
          pointer: "/0/foo/0",
          diffType: diff.NE,
          charDiffs: [{ diffType: diff.CHAR_INS, start: 14, end: 15 }],
        },
      ],
    ]);
  });
});

describe("json pointer", () => {
  test("simple json pointer", () => {
    compareDiffs(`{}`, `{"": 1}`, [
      [
        { line: 1, pointer: "", diffType: diff.LESS },
        { line: 2, pointer: "/", diffType: diff.MORE },
      ],
    ]);

    compareDiffs(`[]`, `[1]`, [
      [
        { line: 1, pointer: "", diffType: diff.LESS },
        { line: 2, pointer: "/0", diffType: diff.MORE },
      ],
    ]);

    compareDiffs(`{}`, `{"0": 1}`, [
      [
        { line: 1, pointer: "", diffType: diff.LESS },
        { line: 2, pointer: "/0", diffType: diff.MORE },
      ],
    ]);
  });

  test("specific chars", () => {
    // escape '~' as '~0'
    compareDiffs(`{"~": 1}`, `{"~0": 1}`, [
      [
        { line: 2, pointer: "/~0", diffType: diff.NE },
        { line: 2, pointer: "/~00", diffType: diff.NE },
      ],
    ]);

    // escape '/' as '~1'
    compareDiffs(`{"/": 1}`, `{"~1": 1}`, [
      [
        { line: 2, pointer: "/~1", diffType: diff.NE },
        { line: 2, pointer: "/~01", diffType: diff.NE },
      ],
    ]);

    compareDiffs(`{"<>": 1}`, `{"\\\\": 1}`, [
      [
        { line: 2, pointer: "/<>", diffType: diff.NE },
        { line: 2, pointer: "/\\", diffType: diff.NE },
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

function gen(...lines: number[]): any {
  let vv = [];
  for (const line of lines) {
    vv.push([
      { line: line, diffType: diff.NE },
      { line: line, diffType: diff.NE },
    ]);
  }
  return vv;
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
