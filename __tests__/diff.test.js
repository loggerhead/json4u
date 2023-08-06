// jest 文档：https://jestjs.io/docs/expect
import * as diff from "../lib/diff";

function expectEq(ltext, rtext, expected, isTextCompare = false) {
  const r = diff.semanticCompare(ltext, rtext);
  expect(r.isTextCompare).toEqual(isTextCompare);
  expect(r.diffs).toEqual(expected);
  return r.isTextCompare;
}

describe("utils", () => {
  test("stringify4diff", () => {
    expect(
      diff.stringify4diff({
        a: BigInt("7777777777777777777"),
        b: "7777777777777777777",
        c: true,
      })
    ).toEqual(`{"a":"7777777777777777777n","b":"7777777777777777777s","c":true}`);
  });

  test("splitKeys", () => {
    expect(diff.splitKeys({ a: 1, b: 2, c: 3 }, { a: 1, c: 3, d: 4 })).toEqual([
      new Set(["a", "c"]),
      new Set(["b"]),
      new Set(["d"]),
    ]);
  });

  test("arrayDiff", () => {
    expect(
      diff.compareArray(
        [{ a: { aa: 1 } }, { b: { bb: 2 } }, { c: { cc: 3 } }],
        [{ a: { aa: 1 } }, { c: { cc: 3 } }, { d: { dd: 4 } }]
      )
    ).toEqual([new diff.Diff(1, 1, diff.DEL), new diff.Diff(2, 1, diff.INS)]);
  });
});

describe("Tree", () => {
  const tree = new diff.Tree(`{
        "a": 7777777777777777777,
        "b": "7777777777777777777",
        "c": true,
    }`);

  test("getKeyNode", () => {
    const node = tree.getKeyNode(["a"]);
    expect(node.length).toBeGreaterThan(0);
    expect(node.offset).toBeGreaterThan(0);
  });

  test("getKey", () => {
    expect(tree.getKey(["a"])).toEqual(`"a"`);
    expect(tree.getKey(["b"])).toEqual(`"b"`);
    expect(tree.getKey(["c"])).toEqual(`"c"`);
  });

  test("getValueNode", () => {
    const node = tree.getValueNode(["a"]);
    expect(node.type).toEqual("number");
    expect(node.value).toBeGreaterThan(0);
    expect(node.length).toBeGreaterThan(0);
    expect(node.offset).toBeGreaterThan(0);
  });

  test("getValue", () => {
    expect(tree.getValue(["a"])).toEqual("7777777777777777777");
    expect(tree.getValue(["b"])).toEqual(`"7777777777777777777"`);
    expect(tree.getValue(["c"])).toEqual("true");
  });
});

describe("Comparer", () => {
  test("diffVal", () => {
    expectEq(`{ "foo": "abc" }`, `{ "foo": "adc" }`, [
      new diff.Diff(11, 1, diff.DEL, false, ["foo"]),
      new diff.Diff(11, 1, diff.INS, false, ["foo"]),
    ]);
  });

  test("diffArray", () => {
    expectEq(`[ "foo", "abc" ]`, `[ "foo", "adc" ]`, [
      new diff.Diff(11, 1, diff.DEL, false, [1]),
      new diff.Diff(11, 1, diff.INS, false, [1]),
    ]);

    expectEq(`[12, 34]`, `[12, 23, 34]`, [new diff.Diff(5, 2, diff.INS, true, [1])]);
  });
});

describe("semanticCompare", () => {
  test("guide example", () => {
    expectEq(
      `{ "int64": 12345678987654321, "key": "value", "array": [12345678987654321, 1, 2, 3]}`,
      `{ "int64": 12345678987654320, "kee": "value", "array": [12345678987654320, 2, 3, 1]}`,
      [
        new diff.Diff(27, 1, diff.DEL, false, ["int64"]),
        new diff.Diff(27, 1, diff.INS, false, ["int64"]),
        new diff.Diff(33, 1, diff.DEL, false, ["key"]),
        new diff.Diff(33, 1, diff.INS, false, ["kee"]),
        new diff.Diff(72, 1, diff.DEL, false, ["array", 0]),
        new diff.Diff(72, 1, diff.INS, false, ["array", 0]),
        new diff.Diff(75, 1, diff.DEL, true, ["array", 1]),
        new diff.Diff(81, 1, diff.INS, true, ["array", 3]),
      ]
    );
  });

  test("char compare", () => {
    expectEq(
      `  "foo": "abc" }`,
      `{ "foo": "adc" }`,
      [
        new diff.Diff(0, 1, diff.INS, false),
        new diff.Diff(11, 1, diff.DEL, false),
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

  test("key compare", () => {
    expectEq(`{ "foo": { "bar": 123 } }`, `{ "foo": { "bzr": 123 } }`, [
      new diff.Diff(13, 1, diff.DEL, false, ["foo", "bar"]),
      new diff.Diff(13, 1, diff.INS, false, ["foo", "bzr"]),
    ]);
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
        new diff.Diff(21, 1, diff.DEL, false, [0, "foo"]),
        new diff.Diff(21, 1, diff.INS, false, [0, "foo"]),
        new diff.Diff(173, 12, diff.DEL, false, [1, "values", 0]),
        new diff.Diff(173, 11, diff.INS, false, [1, "values", 0]),
        new diff.Diff(197, 12, diff.INS, false, [1, "values", 1]),
        new diff.Diff(198, 13, diff.DEL, false, [1, "values", 1]),
      ]
    );
  });

  // copy from https://github.com/zgrossbart/jdd/blob/main/jdd_test.js
  test("jdd cases", () => {
    expectEq(
      `{ "akey": [] }`,
      `{ "akey": null }`,
      [new diff.Diff(10, 2, diff.DEL, false, []), new diff.Diff(10, 4, diff.INS, false, [])],
      true
    );

    expectEq(
      `{ "akey": null }`,
      `{ "akey": [] }`,
      [new diff.Diff(10, 4, diff.DEL, false, []), new diff.Diff(10, 2, diff.INS, false, [])],
      true
    );

    expectEq(`{ "akey": {} }`, `{ "akey": null }`, [
      new diff.Diff(10, 2, diff.DEL, true, []),
      new diff.Diff(10, 4, diff.INS, true, []),
    ]);

    expectEq(`{ "akey": null }`, `{ "akey": {} }`, [
      new diff.Diff(10, 4, diff.DEL, true, []),
      new diff.Diff(10, 2, diff.INS, true, []),
    ]);

    expectEq(
      `{"link": "<a href=\\"http://google.com/\\">Google</a>"}`,
      `{"link": "<a href=\\"http://googlex.com/\\">Google</a>"}`,
      [new diff.Diff(33, 1, diff.INS, false, ["link"])]
    );

    expectEq(
      `{"editor.detectIndentation": false,"editor.tabSize": 2,"files.exclude": {".vscode/": true,"foo": "bar"}}`,
      `{"editor.detectIndentation": false,"editor.tabSize": 2,"files.exclude": {".slash/": true,"foo": "bar"}}`,
      [
        new diff.Diff(75, 6, diff.DEL, false, ["files.exclude", ".vscode/"]),
        new diff.Diff(75, 5, diff.INS, false, ["files.exclude", ".slash/"]),
      ]
    );

    expectEq(
      `{"editor.detectIndentation": false,"editor.tabSize": 2,"files.exclude": {"bas":".vscode/","foo": "bar"}}`,
      `{"editor.detectIndentation": false,"editor.tabSize": 2,"files.exclude": {"bas":".slash/","foo": "bar"}}`,
      [
        new diff.Diff(81, 6, diff.DEL, false, ["files.exclude", "bas"]),
        new diff.Diff(81, 5, diff.INS, false, ["files.exclude", "bas"]),
      ]
    );

    expectEq(
      `{"newline": "a\\nb","slash": "a\\\\b","quotes": "a\\"b","backspace": "a\\bb","formfeed": "a\\fb","carriagereturn": "a\\rb","tab": "a\\tb","a\\nb": "newline","a\\\\b": "slash","a\\"b": "quotes","a\\bb": "backspace","a\\fb": "formfeed","a\\rb": "carriagereturn","a\\tb": "tab"}`,
      `{"newline": "a\\nbx","slash": "a\\\\bx","quotes": "a\\"bx","backspace": "a\\bbx","formfeed": "a\\fbx","carriagereturn": "a\\rbx","tab": "a\\tbx","a\\nb": "newline","a\\\\bx": "slash","a\\"bx": "quotes","a\\bbx": "backspace","a\\fbx": "formfeed","a\\rbx": "carriagereturn","a\\tbx": "tab"}`,
      [
        new diff.Diff(17, 1, diff.INS, false, ["newline"]),
        new diff.Diff(34, 1, diff.INS, false, ["slash"]),
        new diff.Diff(52, 1, diff.INS, false, ["quotes"]),
        new diff.Diff(73, 1, diff.INS, false, ["backspace"]),
        new diff.Diff(93, 1, diff.INS, false, ["formfeed"]),
        new diff.Diff(119, 1, diff.INS, false, ["carriagereturn"]),
        new diff.Diff(134, 1, diff.INS, false, ["tab"]),
        new diff.Diff(160, 1, diff.INS, false, ["a\\bx"]),
        new diff.Diff(177, 1, diff.INS, false, ['a"bx']),
        new diff.Diff(195, 1, diff.INS, false, ["a\bbx"]),
        new diff.Diff(216, 1, diff.INS, false, ["a\fbx"]),
        new diff.Diff(236, 1, diff.INS, false, ["a\rbx"]),
        new diff.Diff(262, 1, diff.INS, false, ["a\tbx"]),
      ]
    );

    expectEq(
      `{"foo":[{  "OBJ_ID": "CN=Kate Smith,OU=Users,OU=Willow,DC=cloudaddc,DC=qalab,DC=cam,DC=novell,DC=com",  "userAccountControl": "512",  "objectGUID": "b3067a77-875b-4208-9ee3-39128adeb654",  "lastLogon": "0",  "sAMAccountName": "ksmith",  "userPrincipalName": "ksmith@cloudaddc.qalab.cam.novell.com",  "distinguishedName": "CN=Kate Smith,OU=Users,OU=Willow,DC=cloudaddc,DC=qalab,DC=cam,DC=novell,DC=com"},{  "OBJ_ID": "CN=Timothy Swan,OU=Users,OU=Willow,DC=cloudaddc,DC=qalab,DC=cam,DC=novell,DC=com",  "userAccountControl": "512",  "objectGUID": "c3f7dae9-9b4f-4d55-a1ec-bf9ef45061c3",  "lastLogon": "130766915788304915",  "sAMAccountName": "tswan",  "userPrincipalName": "tswan@cloudaddc.qalab.cam.novell.com",  "distinguishedName": "CN=Timothy Swan,OU=Users,OU=Willow,DC=cloudaddc,DC=qalab,DC=cam,DC=novell,DC=com"}]}`,
      `[{  "OBJ_ID": "CN=Timothy Swan,OU=Users,OU=Willow,DC=cloudaddc,DC=qalab,DC=cam,DC=novell,DC=com",  "userAccountControl": "512",  "objectGUID": "c3f7dae9-9b4f-4d55-a1ec-bf9ef45061c3",  "lastLogon": "130766915788304915",  "sAMAccountName": "tswan",  "userPrincipalName": "tswan@cloudaddc.qalab.cam.novell.com",  "distinguishedName": "CN=Timothy Swan,OU=Users,OU=Willow,DC=cloudaddc,DC=qalab,DC=cam,DC=novell,DC=com"}]`,
      [new diff.Diff(0, 818, diff.DEL, true, []), new diff.Diff(0, 415, diff.INS, true, [])]
    );

    expectEq(
      `{"Aidan Gillen": {"array": ["Game of Thron\\"es","The Wire"],"string": "some string","int": 2,"aboolean": true, "boolean": true, "null": null, "a_null": null, "another_null": "null check", "object": {"foo": "bar","object1": {"new prop1": "new prop value"},"object2": {"new prop1": "new prop value"},"object3": {"new prop1": "new prop value"},"object4": {"new prop1": "new prop value"}}},"Amy Ryan": {"one": "In Treatment","two": "The Wire"},"Annie Fitzgerald": ["Big Love","True Blood"],"Anwan Glover": ["Treme","The Wire"],"Alexander Skarsgard": ["Generation Kill","True Blood"], "Clarke Peters": null}`,
      `{"Aidan Gillen": {"array": ["Game of Thrones","The Wire"],"string": "some string","int": "2","otherint": 4, "aboolean": "true", "boolean": false, "null": null, "a_null":88, "another_null": null, "object": {"foo": "bar"}},"Amy Ryan": ["In Treatment","The Wire"],"Annie Fitzgerald": ["True Blood","Big Love","The Sopranos","Oz"],"Anwan Glover": ["Treme","The Wire"],"Alexander Skarsg?rd": ["Generation Kill","True Blood"],"Alice Farmer": ["The Corner","Oz","The Wire"]}`,
      [
        new diff.Diff(42, 2, diff.DEL, false, ["Aidan Gillen", "array", 0]),
        new diff.Diff(89, 3, diff.INS, true, []),
        new diff.Diff(91, 1, diff.DEL, true, []),
        new diff.Diff(105, 4, diff.DEL, true, []),
        new diff.Diff(105, 1, diff.INS, true, ["Aidan Gillen", "otherint"]),
        new diff.Diff(120, 6, diff.INS, true, []),
        new diff.Diff(122, 3, diff.DEL, false, ["Aidan Gillen", "boolean"]),
        new diff.Diff(139, 4, diff.INS, false, ["Aidan Gillen", "boolean"]),
        new diff.Diff(152, 4, diff.DEL, true, []),
        new diff.Diff(169, 2, diff.INS, true, []),
        new diff.Diff(174, 12, diff.DEL, true, []),
        new diff.Diff(189, 4, diff.INS, true, []),
        new diff.Diff(223, 31, diff.DEL, true, ["Aidan Gillen", "object", "object1"]),
        new diff.Diff(233, 27, diff.INS, true, []),
        new diff.Diff(266, 31, diff.DEL, true, ["Aidan Gillen", "object", "object2"]),
        new diff.Diff(306, 14, diff.INS, true, ["Annie Fitzgerald", 2]),
        new diff.Diff(309, 31, diff.DEL, true, ["Aidan Gillen", "object", "object3"]),
        new diff.Diff(321, 4, diff.INS, true, ["Annie Fitzgerald", 3]),
        new diff.Diff(352, 31, diff.DEL, true, ["Aidan Gillen", "object", "object4"]),
        new diff.Diff(381, 1, diff.INS, false, ["Alexander Skarsg?rd"]),
        new diff.Diff(398, 41, diff.DEL, true, []),
        new diff.Diff(436, 30, diff.INS, true, ["Alice Farmer"]),
        new diff.Diff(540, 1, diff.DEL, false, ["Alexander Skarsgard"]),
        new diff.Diff(597, 4, diff.DEL, true, ["Clarke Peters"]),
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
