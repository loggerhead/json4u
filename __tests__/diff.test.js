// jest 文档：https://jestjs.io/docs/expect
import * as diff from "../lib/diff";

function expectEq(ltext, rtext, expected, isTextCompare = false) {
  const r = diff.semanticCompare(ltext, rtext);
  expect(
    r.diffs.map((d) => {
      d.node = null;
      return d;
    })
  ).toEqual(expected);
  expect(r.isTextCompare).toEqual(isTextCompare);
  return r.isTextCompare;
}

describe("utils", () => {
  test("splitKeys", () => {
    expect(diff.splitKeys(["a", "b", "c"], ["a", "c", "d"])).toEqual([
      new Set(["a", "c"]),
      new Set(["b"]),
      new Set(["d"]),
    ]);
  });

  test("arrayDiff", () => {
    expect(diff.compareArray(["a", "b", "c"], ["a", "c", "d"])).toEqual([
      new diff.Diff(1, 1, diff.DEL),
      new diff.Diff(2, 1, diff.INS),
    ]);
  });
});

describe("Comparer", () => {
  test("diffVal", () => {
    expectEq(`{ "foo": "abc" }`, `{ "foo": "adc" }`, [
      new diff.Diff(11, 1, diff.DEL, false),
      new diff.Diff(11, 1, diff.INS, false),
    ]);
  });

  test("diffArray", () => {
    expectEq(`[ "foo", "abc" ]`, `[ "foo", "adc" ]`, [
      new diff.Diff(11, 1, diff.DEL, false),
      new diff.Diff(11, 1, diff.INS, false),
    ]);

    expectEq(`[12, 34]`, `[12, 23, 34]`, [new diff.Diff(5, 2, diff.INS, true)]);
  });
});

describe("semanticCompare", () => {
  test("guide example", () => {
    expectEq(
      `{ "int64": 12345678987654321, "key": "value", "array": [12345678987654321, 0.1234567891111111111, 1, 2, 3]}`,
      `{ "int64": 12345678987654320, "kee": "value", "array": [12345678987654320, 0.1234567891111111110, 2, 3, 1]}`,
      [
        new diff.Diff(27, 1, diff.DEL, false),
        new diff.Diff(30, 14, diff.DEL, true),
        new diff.Diff(72, 1, diff.DEL, false),
        new diff.Diff(95, 1, diff.DEL, false),
        new diff.Diff(98, 1, diff.DEL, true),
        new diff.Diff(27, 1, diff.INS, false),
        new diff.Diff(30, 14, diff.INS, true),
        new diff.Diff(72, 1, diff.INS, false),
        new diff.Diff(95, 1, diff.INS, false),
        new diff.Diff(104, 1, diff.INS, true),
      ]
    );
  });

  test("char compare", () => {
    expectEq(
      `  "foo": "abc" }`,
      `{ "foo": "adc" }`,
      [
        new diff.Diff(11, 1, diff.DEL, false),
        new diff.Diff(0, 1, diff.INS, false),
        new diff.Diff(11, 1, diff.INS, false),
      ],
      true
    );
    expectEq(
      `[
     ,
    2
`,
      `[
    1,
    2
]`,
      [new diff.Diff(6, 1, diff.INS, false), new diff.Diff(15, 1, diff.INS, false)],
      true
    );
  });

  test("compare array", () => {
    expectEq(
      `[
    {
      "foo": 1,
      "bar": "baz",
      "values": [
        "1777777777777777"
      ]
    },
    {
      "foo": 9,
      "bar": "qux",
      "values": [
        "1690848000000",
        "1691193600000"
      ]
    }
]`,
      `[
    {
      "foo": 7,
      "bar": "baz",
      "values": [
        "1777777777777777"
      ]
    },
    {
      "foo": 9,
      "bar": "qux",
      "values": [
        "0xc000c6e720",
        "0xc000c6e728"
      ]
    }
]`,
      [
        new diff.Diff(21, 1, diff.DEL, false),
        new diff.Diff(173, 12, diff.DEL, false),
        new diff.Diff(198, 13, diff.DEL, false),
        new diff.Diff(21, 1, diff.INS, false),
        new diff.Diff(173, 11, diff.INS, false),
        new diff.Diff(197, 12, diff.INS, false),
      ]
    );
  });

  // copy from https://github.com/zgrossbart/jdd/blob/main/jdd_test.js
  describe("jdd cases", () => {
    test("inconsistent type", () => {
      expectEq(`{ "akey": [] }`, `{ "akey": null }`, [
        new diff.Diff(10, 2, diff.DEL, true),
        new diff.Diff(10, 4, diff.INS, true),
      ]);

      expectEq(`{ "akey": null }`, `{ "akey": [] }`, [
        new diff.Diff(10, 4, diff.DEL, true),
        new diff.Diff(10, 2, diff.INS, true),
      ]);

      expectEq(`{ "akey": {} }`, `{ "akey": null }`, [
        new diff.Diff(10, 2, diff.DEL, true),
        new diff.Diff(10, 4, diff.INS, true),
      ]);

      expectEq(`{ "akey": null }`, `{ "akey": {} }`, [
        new diff.Diff(10, 4, diff.DEL, true),
        new diff.Diff(10, 2, diff.INS, true),
      ]);
    });

    test("simple diff", () => {
      expectEq(
        `{"link": "<a href=\\"http://google.com/\\">Google</a>"}`,
        `{"link": "<a href=\\"http://googlex.com/\\">Google</a>"}`,
        [new diff.Diff(33, 1, diff.INS, false)]
      );

      expectEq(
        `{"editor.detectIndentation": false,"editor.tabSize": 2,"files.exclude": {".vscode/": true,"foo": "bar"}}`,
        `{"editor.detectIndentation": false,"editor.tabSize": 2,"files.exclude": {".slash/": true,"foo": "bar"}}`,
        [new diff.Diff(73, 16, diff.DEL, true), new diff.Diff(73, 15, diff.INS, true)]
      );

      expectEq(
        `{"editor.detectIndentation": false,"editor.tabSize": 2,"files.exclude": {"bas":".vscode/","foo": "bar"}}`,
        `{"editor.detectIndentation": false,"editor.tabSize": 2,"files.exclude": {"bas":".slash/","foo": "bar"}}`,
        [new diff.Diff(81, 6, diff.DEL, false), new diff.Diff(81, 5, diff.INS, false)]
      );
    });

    test("escape diff", () => {
      expectEq(
        `{"newline": "a\\nb","slash": "a\\\\b","quotes": "a\\"b","backspace": "a\\bb","formfeed": "a\\fb","carriagereturn": "a\\rb","tab": "a\\tb","a\\nb": "newline","a\\\\b": "slash","a\\"b": "quotes","a\\bb": "backspace","a\\fb": "formfeed","a\\rb": "carriagereturn","a\\tb": "tab"}`,
        `{"newline": "a\\nbx","slash": "a\\\\bx","quotes": "a\\"bx","backspace": "a\\bbx","formfeed": "a\\fbx","carriagereturn": "a\\rbx","tab": "a\\tbx","a\\nb": "newline","a\\\\bx": "slash","a\\"bx": "quotes","a\\bbx": "backspace","a\\fbx": "formfeed","a\\rbx": "carriagereturn","a\\tbx": "tab"}`,
        [
          new diff.Diff(148, 15, diff.DEL, true),
          new diff.Diff(164, 16, diff.DEL, true),
          new diff.Diff(181, 19, diff.DEL, true),
          new diff.Diff(201, 18, diff.DEL, true),
          new diff.Diff(220, 24, diff.DEL, true),
          new diff.Diff(245, 13, diff.DEL, true),
          new diff.Diff(17, 1, diff.INS, false),
          new diff.Diff(34, 1, diff.INS, false),
          new diff.Diff(52, 1, diff.INS, false),
          new diff.Diff(73, 1, diff.INS, false),
          new diff.Diff(93, 1, diff.INS, false),
          new diff.Diff(119, 1, diff.INS, false),
          new diff.Diff(134, 1, diff.INS, false),
          new diff.Diff(155, 16, diff.INS, true),
          new diff.Diff(172, 17, diff.INS, true),
          new diff.Diff(190, 20, diff.INS, true),
          new diff.Diff(211, 19, diff.INS, true),
          new diff.Diff(231, 25, diff.INS, true),
          new diff.Diff(257, 14, diff.INS, true),
        ]
      );

      expectEq(
        `{"foo":[{  "OBJ_ID": "CN=Kate Smith,OU=Users,OU=Willow,DC=cloudaddc,DC=qalab,DC=cam,DC=novell,DC=com",  "userAccountControl": "512",  "objectGUID": "b3067a77-875b-4208-9ee3-39128adeb654",  "lastLogon": "0",  "sAMAccountName": "ksmith",  "userPrincipalName": "ksmith@cloudaddc.qalab.cam.novell.com",  "distinguishedName": "CN=Kate Smith,OU=Users,OU=Willow,DC=cloudaddc,DC=qalab,DC=cam,DC=novell,DC=com"},{  "OBJ_ID": "CN=Timothy Swan,OU=Users,OU=Willow,DC=cloudaddc,DC=qalab,DC=cam,DC=novell,DC=com",  "userAccountControl": "512",  "objectGUID": "c3f7dae9-9b4f-4d55-a1ec-bf9ef45061c3",  "lastLogon": "130766915788304915",  "sAMAccountName": "tswan",  "userPrincipalName": "tswan@cloudaddc.qalab.cam.novell.com",  "distinguishedName": "CN=Timothy Swan,OU=Users,OU=Willow,DC=cloudaddc,DC=qalab,DC=cam,DC=novell,DC=com"}]}`,
        `[{  "OBJ_ID": "CN=Timothy Swan,OU=Users,OU=Willow,DC=cloudaddc,DC=qalab,DC=cam,DC=novell,DC=com",  "userAccountControl": "512",  "objectGUID": "c3f7dae9-9b4f-4d55-a1ec-bf9ef45061c3",  "lastLogon": "130766915788304915",  "sAMAccountName": "tswan",  "userPrincipalName": "tswan@cloudaddc.qalab.cam.novell.com",  "distinguishedName": "CN=Timothy Swan,OU=Users,OU=Willow,DC=cloudaddc,DC=qalab,DC=cam,DC=novell,DC=com"}]`,
        [new diff.Diff(0, 818, diff.DEL, true), new diff.Diff(0, 415, diff.INS, true)]
      );

      expectEq(
        `{"Aidan Gillen": {"array": ["Game of Thron\\"es","The Wire"],"string": "some string","int": 2,"aboolean": true, "boolean": true, "null": null, "a_null": null, "another_null": "null check", "object": {"foo": "bar","object1": {"new prop1": "new prop value"},"object2": {"new prop1": "new prop value"},"object3": {"new prop1": "new prop value"},"object4": {"new prop1": "new prop value"}}},"Amy Ryan": {"one": "In Treatment","two": "The Wire"},"Annie Fitzgerald": ["Big Love","True Blood"],"Anwan Glover": ["Treme","The Wire"],"Alexander Skarsgard": ["Generation Kill","True Blood"], "Clarke Peters": null}`,
        `{"Aidan Gillen": {"array": ["Game of Thrones","The Wire"],"string": "some string","int": "2","otherint": 4, "aboolean": "true", "boolean": false, "null": null, "a_null":88, "another_null": null, "object": {"foo": "bar"}},"Amy Ryan": ["In Treatment","The Wire"],"Annie Fitzgerald": ["True Blood","Big Love","The Sopranos","Oz"],"Anwan Glover": ["Treme","The Wire"],"Alexander Skarsg?rd": ["Generation Kill","True Blood"],"Alice Farmer": ["The Corner","Oz","The Wire"]}`,
        [
          new diff.Diff(42, 2, diff.DEL, false),
          new diff.Diff(91, 1, diff.DEL, false),
          new diff.Diff(122, 3, diff.DEL, false),
          new diff.Diff(152, 4, diff.DEL, false),
          new diff.Diff(174, 1, diff.DEL, false),
          new diff.Diff(179, 7, diff.DEL, false),
          new diff.Diff(212, 42, diff.DEL, true),
          new diff.Diff(255, 42, diff.DEL, true),
          new diff.Diff(298, 42, diff.DEL, true),
          new diff.Diff(341, 42, diff.DEL, true),
          new diff.Diff(398, 41, diff.DEL, true),
          new diff.Diff(461, 10, diff.DEL, true),
          new diff.Diff(523, 55, diff.DEL, true),
          new diff.Diff(580, 21, diff.DEL, true),
          new diff.Diff(89, 3, diff.INS, false),
          new diff.Diff(93, 13, diff.INS, true),
          new diff.Diff(120, 1, diff.INS, false),
          new diff.Diff(125, 1, diff.INS, false),
          new diff.Diff(139, 4, diff.INS, false),
          new diff.Diff(169, 2, diff.INS, false),
          new diff.Diff(233, 27, diff.INS, true),
          new diff.Diff(295, 10, diff.INS, true),
          new diff.Diff(306, 14, diff.INS, true),
          new diff.Diff(321, 4, diff.INS, true),
          new diff.Diff(364, 55, diff.INS, true),
          new diff.Diff(420, 46, diff.INS, true),
        ]
      );

      expectEq(
        `[{  "OBJ_ID": "CN=Kate Smith,OU=Users,OU=Willow,DC=cloudaddc,DC=qalab,DC=cam,DC=novell,DC=com",  "userAccountControl": "512",  "objectGUID": "b3067a77-875b-4208-9ee3-39128adeb654",  "lastLogon": "0",  "sAMAccountName": "ksmith",  "userPrincipalName": "ksmith@cloudaddc.qalab.cam.novell.com",  "distinguishedName": "CN=Kate Smith,OU=Users,OU=Willow,DC=cloudaddc,DC=qalab,DC=cam,DC=novell,DC=com"},{  "OBJ_ID": "CN=Timothy Swan,OU=Users,OU=Willow,DC=cloudaddc,DC=qalab,DC=cam,DC=novell,DC=com",  "userAccountControl": "512",  "objectGUID": "c3f7dae9-9b4f-4d55-a1ec-bf9ef45061c3",  "lastLogon": "130766915788304915",  "sAMAccountName": "tswan",  "userPrincipalName": "tswan@cloudaddc.qalab.cam.novell.com",  "distinguishedName": "CN=Timothy Swan,OU=Users,OU=Willow,DC=cloudaddc,DC=qalab,DC=cam,DC=novell,DC=com"}]`,
        `{"foo":[{  "OBJ_ID": "CN=Timothy Swan,OU=Users,OU=Willow,DC=cloudaddc,DC=qalab,DC=cam,DC=novell,DC=com",  "userAccountControl": "512",  "objectGUID": "c3f7dae9-9b4f-4d55-a1ec-bf9ef45061c3",  "lastLogon": "130766915788304915",  "sAMAccountName": "tswan",  "userPrincipalName": "tswan@cloudaddc.qalab.cam.novell.com",  "distinguishedName": "CN=Timothy Swan,OU=Users,OU=Willow,DC=cloudaddc,DC=qalab,DC=cam,DC=novell,DC=com"}]}`,
        [new diff.Diff(0, 810, diff.DEL, true, []), new diff.Diff(0, 423, diff.INS, true, [])]
      );

      expectEq(
        `[{  "OBJ_ID": "CN=Kate Smith,OU=Users,OU=Willow,DC=cloudaddc,DC=qalab,DC=cam,DC=novell,DC=com",  "userAccountControl": "512",  "objectGUID": "b3067a77-875b-4208-9ee3-39128adeb654",  "lastLogon": "0",  "sAMAccountName": "ksmith",  "userPrincipalName": "ksmith@cloudaddc.qalab.cam.novell.com",  "distinguishedName": "CN=Kate Smith,OU=Users,OU=Willow,DC=cloudaddc,DC=qalab,DC=cam,DC=novell,DC=com"},{  "OBJ_ID": "CN=Timothy Swan,OU=Users,OU=Willow,DC=cloudaddc,DC=qalab,DC=cam,DC=novell,DC=com",  "userAccountControl": "512",  "objectGUID": "c3f7dae9-9b4f-4d55-a1ec-bf9ef45061c3",  "lastLogon": "130766915788304915",  "sAMAccountName": "tswan",  "userPrincipalName": "tswan@cloudaddc.qalab.cam.novell.com",  "distinguishedName": "CN=Timothy Swan,OU=Users,OU=Willow,DC=cloudaddc,DC=qalab,DC=cam,DC=novell,DC=com"}]`,
        `[{  "OBJ_ID": "CN=Timothy Swan,OU=Users,OU=Willow,DC=cloudaddc,DC=qalab,DC=cam,DC=novell,DC=com",  "userAccountControl": "512",  "objectGUID": "c3f7dae9-9b4f-4d55-a1ec-bf9ef45061c3",  "lastLogon": "130766915788304915",  "sAMAccountName": "tswan",  "userPrincipalName": "tswan@cloudaddc.qalab.cam.novell.com",  "distinguishedName": "CN=Timothy Swan,OU=Users,OU=Willow,DC=cloudaddc,DC=qalab,DC=cam,DC=novell,DC=com"}]`,
        [new diff.Diff(1, 394, diff.DEL, true, [0])]
      );
    });
  });

  describe("bug cases", () => {
    test("highlight error", () => {
      expectEq(
        `{
    "null": "nul check",
    "num": 1
}`,
        `{
    "null": null,
    "num": 1
}`,
        [
          new diff.Diff(14, 1, diff.DEL, false),
          new diff.Diff(18, 7, diff.DEL, false),
          new diff.Diff(17, 1, diff.INS, false),
        ]
      );
    });
  });
});
