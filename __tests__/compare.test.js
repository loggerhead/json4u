// jest 文档：https://jestjs.io/docs/expect
import * as compare from "../lib/compare";

function expectEq(ltext, rtext, {hunks, inlines, isTextCompare}) {
  const r = compare.smartCompare(ltext, rtext);
  const gotInlineDiffs = compare.sort(r.inlineDiffs());
  const gotHunkDiffs = compare.sort(r.hunkDiffs()).map((d) => {
    d.inlineDiffs = [];
    return d;
  });

  expect(hunks !== undefined || inlines !== undefined || isTextCompare !== undefined).toEqual(true);
  expect(r.isTextCompare || false).toEqual(isTextCompare || false);

  if (hunks) {
    // console.log("hunks", gotHunkDiffs);
    expect(gotHunkDiffs).toMatchObject(hunks);
  }

  if (inlines) {
    // console.log("inlines", gotInlineDiffs);
    expect(gotInlineDiffs).toMatchObject(inlines);
  }
}

describe("utils", () => {
  test("splitKeys", () => {
    expect(compare.splitKeys(["a", "b", "c"], ["a", "c", "d"])).toMatchObject([
      new Set(["a", "c"]),
      new Set(["b"]),
      new Set(["d"]),
    ]);
  });

  test("arrayDiff", () => {
    expect(compare.compareArray(["a", "b", "c"], ["a", "c", "d"])).toMatchObject([
      new compare.Diff(1, 1, compare.DEL),
      new compare.Diff(2, 1, compare.INS),
    ]);
  });
});

describe("Comparer", () => {
  test("diffVal", () => {
    expectEq(`{ "foo": "abc" }`, `{ "foo": "adc" }`, {
      inlines: [
        new compare.Diff(11, 1, compare.DEL),
        new compare.Diff(11, 1, compare.INS),
      ],
    });
  });

  test("diffArray", () => {
    expectEq(`[ "foo", "abc" ]`, `[ "foo", "adc" ]`, {
      inlines: [
        new compare.Diff(11, 1, compare.DEL),
        new compare.Diff(11, 1, compare.INS),
      ],
    });

    expectEq(`[12, 34]`, `[12, 23, 34]`, {
      hunks: [
        new compare.Diff(5, 2, compare.INS),
      ],
    });

    expectEq(`[
    12345678987654321,
    0.1234567891111111111,
    1,
    2,
    3
]`, `[
    12345678987654320,
    0.1234567891111111110,
    2,
    3,
    1
]`, {
      hunks: [
        new compare.Diff(6, 17, compare.DEL),
        new compare.Diff(29, 21, compare.DEL),
        new compare.Diff(56, 1, compare.DEL),
        new compare.Diff(6, 17, compare.INS),
        new compare.Diff(29, 21, compare.INS),
        new compare.Diff(70, 1, compare.INS),
      ],
      inlines: [
        new compare.Diff(22, 1, compare.DEL),
        new compare.Diff(49, 1, compare.DEL),
        new compare.Diff(22, 1, compare.INS),
        new compare.Diff(49, 1, compare.INS),
      ],
    });
  });

  test("human-readable case", () => {
    expectEq(
      `{
    "Aidan Gillen": {
        "array": [
            "Game of Thron\\\\"es",
            "The Wire"
        ],
        "string": "some string",
        "int": 2,
        "aboolean": true,
        "boolean": true,
        "null": null,
        "a_null": null,
        "another_null": "null check",
        "object": {
            "foo": "bar",
            "object1": {
                "new prop1": "new prop value"
            },
            "object2": {
                "new prop1": "new prop value"
            },
            "object3": {
                "new prop1": "new prop value"
            },
            "object4": {
                "new prop1": "new prop value"
            }
        }
    },
    "Amy Ryan": {
        "one": "In Treatment",
        "two": "The Wire"
    },
    "Annie Fitzgerald": [
        "Big Love",
        "True Blood"
    ],
    "Anwan Glover": [
        "Treme",
        "The Wire"
    ],
    "Alexander Skarsgard": [
        "Generation Kill",
        "True Blood"
    ],
    "Clarke Peters": null
}`,
      `{
    "Aidan Gillen": {
        "array": [
            "Game of Thrones",
            "The Wire"
        ],
        "string": "some string",
        "int": "2",
        "otherint": 4,
        "aboolean": "true",
        "boolean": false,
        "null": null,
        "a_null": 88,
        "another_null": null,
        "object": {
            "foo": "bar"
        }
    },
    "Amy Ryan": [
        "In Treatment",
        "The Wire"
    ],
    "Annie Fitzgerald": [
        "True Blood",
        "Big Love",
        "The Sopranos",
        "Oz"
    ],
    "Anwan Glover": [
        "Treme",
        "The Wire"
    ],
    "Alexander Skarsg?rd": [
        "Generation Kill",
        "True Blood"
    ],
    "Alice Farmer": [
        "The Corner",
        "Oz",
        "The Wire"
    ]
}`,
      {
        isTextCompare: true,
        hunks: [
          new compare.Diff(43, 33, compare.DEL),
          new compare.Diff(144, 68, compare.DEL),
          new compare.Diff(235, 61, compare.DEL),
          new compare.Diff(317, 368, compare.DEL),
          new compare.Diff(703, 81, compare.DEL),
          new compare.Diff(831, 20, compare.DEL),
          new compare.Diff(924, 28, compare.DEL),
          new compare.Diff(1008, 25, compare.DEL),
          new compare.Diff(43, 30, compare.INS),
          new compare.Diff(141, 96, compare.INS),
          new compare.Diff(260, 51, compare.INS),
          new compare.Diff(332, 24, compare.INS),
          new compare.Diff(374, 67, compare.INS),
          new compare.Diff(468, 21, compare.INS),
          new compare.Diff(510, 36, compare.INS),
          new compare.Diff(619, 28, compare.INS),
          new compare.Diff(703, 82, compare.INS),
        ],
        inlines: [
          new compare.Diff(69, 2, compare.DEL),
          new compare.Diff(72, 3, compare.DEL),
          new compare.Diff(207, 3, compare.DEL),
          new compare.Diff(253, 4, compare.DEL),
          new compare.Diff(283, 1, compare.DEL),
          new compare.Diff(288, 7, compare.DEL),
          new compare.Diff(341, 1, compare.DEL),
          new compare.Diff(343, 343, compare.DEL),
          new compare.Diff(719, 1, compare.DEL),
          new compare.Diff(730, 7, compare.DEL),
          new compare.Diff(761, 7, compare.DEL),
          new compare.Diff(782, 1, compare.DEL),
          new compare.Diff(841, 2, compare.DEL),
          new compare.Diff(845, 5, compare.DEL),
          new compare.Diff(945, 1, compare.DEL),
          new compare.Diff(1013, 5, compare.DEL),
          new compare.Diff(1020, 6, compare.DEL),
          new compare.Diff(1029, 4, compare.DEL),
          new compare.Diff(69, 2, compare.INS),
          new compare.Diff(156, 1, compare.INS),
          new compare.Diff(158, 1, compare.INS),
          new compare.Diff(170, 23, compare.INS),
          new compare.Diff(204, 1, compare.INS),
          new compare.Diff(209, 1, compare.INS),
          new compare.Diff(231, 4, compare.INS),
          new compare.Diff(278, 2, compare.INS),
          new compare.Diff(390, 1, compare.INS),
          new compare.Diff(439, 1, compare.INS),
          new compare.Diff(520, 1, compare.INS),
          new compare.Diff(523, 8, compare.INS),
          new compare.Diff(532, 1, compare.INS),
          new compare.Diff(534, 13, compare.INS),
          new compare.Diff(640, 1, compare.INS),
          new compare.Diff(708, 4, compare.INS),
          new compare.Diff(714, 6, compare.INS),
          new compare.Diff(723, 1, compare.INS),
          new compare.Diff(725, 61, compare.INS),
        ],
      },
    );
  });
});

describe("semanticCompare", () => {
  test("guide example", () => {
    expectEq(
      `{
    "int64": 12345678987654321,
    "key": "value",
    "array": [
        12345678987654321,
        0.1234567891111111111,
        1,
        2,
        3
    ]
}`,
      `{
    "int64": 12345678987654320,
    "kee": "value",
    "array": [
        12345678987654320,
        0.1234567891111111110,
        2,
        3,
        1
    ]
}`,
      {
        hunks: [
          new compare.Diff(15, 17, compare.DEL),
          new compare.Diff(38, 14, compare.DEL),
          new compare.Diff(77, 17, compare.DEL),
          new compare.Diff(104, 21, compare.DEL),
          new compare.Diff(135, 1, compare.DEL),
          new compare.Diff(15, 17, compare.INS),
          new compare.Diff(38, 14, compare.INS),
          new compare.Diff(77, 17, compare.INS),
          new compare.Diff(104, 21, compare.INS),
          new compare.Diff(157, 1, compare.INS),
        ],
        inlines: [
          new compare.Diff(31, 1, compare.DEL),
          new compare.Diff(93, 1, compare.DEL),
          new compare.Diff(124, 1, compare.DEL),
          new compare.Diff(31, 1, compare.INS),
          new compare.Diff(93, 1, compare.INS),
          new compare.Diff(124, 1, compare.INS),
        ],
      },
    );
  });

  test("char compare", () => {
    expectEq(
      ``,
      ``,
      {
        hunks: [],
        inlines: [],
        isTextCompare: true,
      },
    );

    expectEq(
      `  "foo": "abc" }`,
      `{ "foo": "adc" }`,
      {
        inlines: [
          new compare.Diff(0, 1, compare.DEL),
          new compare.Diff(11, 1, compare.DEL),
          new compare.Diff(0, 1, compare.INS),
          new compare.Diff(11, 1, compare.INS),
        ],
        isTextCompare: true,
      },
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
      {
        inlines: [
          new compare.Diff(6, 1, compare.DEL),
          new compare.Diff(15, 1, compare.DEL),
          new compare.Diff(6, 1, compare.INS),
          new compare.Diff(15, 1, compare.INS),
        ],
        isTextCompare: true,
      },
    );
  });

  // copy from https://github.com/zgrossbart/jdd/blob/main/jdd_test.js
  test("inconsistent type", () => {
    expectEq(`{ "akey": [] }`, `{ "akey": null }`, {
      hunks: [
        new compare.Diff(10, 2, compare.DEL),
        new compare.Diff(10, 4, compare.INS),
      ],
    });

    expectEq(`{ "akey": null }`, `{ "akey": [] }`, {
      hunks: [
        new compare.Diff(10, 4, compare.DEL),
        new compare.Diff(10, 2, compare.INS),
      ],
    });

    expectEq(`{ "akey": {} }`, `{ "akey": null }`, {
      hunks: [
        new compare.Diff(10, 2, compare.DEL),
        new compare.Diff(10, 4, compare.INS),
      ],
    });

    expectEq(`{ "akey": null }`, `{ "akey": {} }`, {
      hunks: [
        new compare.Diff(10, 4, compare.DEL),
        new compare.Diff(10, 2, compare.INS),
      ],
    });
  });

  test("simple compare", () => {
    expectEq(
      `12345`,
      ``,
      {
        isTextCompare: true,
        hunks: [new compare.Diff(0, 5, compare.DEL)],
      },
    );

    expectEq(
      ``,
      `12345`,
      {
        isTextCompare: true,
        hunks: [new compare.Diff(0, 5, compare.INS)],
      },
    );

    expectEq(
      `a`,
      `a2345`,
      {
        isTextCompare: true,
        hunks: [new compare.Diff(0, 1, compare.DEL), new compare.Diff(0, 5, compare.INS)],
        inlines: [new compare.Diff(1, 4, compare.INS)],
      },
    );

    expectEq(
      `{"link": "<a href=\\"http://google.com/\\">Google</a>"}`,
      `{"link": "<a href=\\"http://googlex.com/\\">Google</a>"}`,
      {inlines: [new compare.Diff(33, 1, compare.INS)]},
    );

    expectEq(
      `{"editor.detectIndentation": false,"editor.tabSize": 2,"files.exclude": {".vscode/": true,"foo": "bar"}}`,
      `{"editor.detectIndentation": false,"editor.tabSize": 2,"files.exclude": {".slash/": true,"foo": "bar"}}`,
      {hunks: [new compare.Diff(73, 16, compare.DEL), new compare.Diff(73, 15, compare.INS)]},
    );

    expectEq(
      `{"editor.detectIndentation": false,"editor.tabSize": 2,"files.exclude": {"bas":".vscode/","foo": "bar"}}`,
      `{"editor.detectIndentation": false,"editor.tabSize": 2,"files.exclude": {"bas":".slash/","foo": "bar"}}`,
      {
        inlines: [
          new compare.Diff(81, 6, compare.DEL),
          new compare.Diff(81, 5, compare.INS),
        ],
      },
    );
  });

  test("escape compare", () => {
    expectEq(
      `{
    "newline": "a\\nb",
    "slash": "a\\\\b",
    "quotes": "a\\"b",
    "backspace": "a\\bb",
    "formfeed": "a\\fb",
    "carriagereturn": "a\\rb",
    "tab": "a\\tb",
    "a\\nb": "newline",
    "a\\\\b": "slash",
    "a\\"b": "quotes",
    "a\\bb": "backspace",
    "a\\fb": "formfeed",
    "a\\rb": "carriagereturn",
    "a\\tb": "tab"
}`,
      `{
    "newline": "a\\nbx",
    "slash": "a\\\\bx",
    "quotes": "a\\"bx",
    "backspace": "a\\bbx",
    "formfeed": "a\\fbx",
    "carriagereturn": "a\\rbx",
    "tab": "a\\tbx",
    "a\\nb": "newline",
    "a\\\\bx": "slash",
    "a\\"bx": "quotes",
    "a\\bbx": "backspace",
    "a\\fbx": "formfeed",
    "a\\rbx": "carriagereturn",
    "a\\tbx": "tab"
}`,
      {
        hunks: [
          new compare.Diff(17, 6, compare.DEL),
          new compare.Diff(38, 6, compare.DEL),
          new compare.Diff(60, 6, compare.DEL),
          new compare.Diff(85, 6, compare.DEL),
          new compare.Diff(109, 6, compare.DEL),
          new compare.Diff(139, 6, compare.DEL),
          new compare.Diff(158, 6, compare.DEL),
          new compare.Diff(193, 15, compare.DEL),
          new compare.Diff(214, 16, compare.DEL),
          new compare.Diff(236, 19, compare.DEL),
          new compare.Diff(261, 18, compare.DEL),
          new compare.Diff(285, 24, compare.DEL),
          new compare.Diff(315, 13, compare.DEL),
          new compare.Diff(17, 7, compare.INS),
          new compare.Diff(39, 7, compare.INS),
          new compare.Diff(62, 7, compare.INS),
          new compare.Diff(88, 7, compare.INS),
          new compare.Diff(113, 7, compare.INS),
          new compare.Diff(144, 7, compare.INS),
          new compare.Diff(164, 7, compare.INS),
          new compare.Diff(200, 16, compare.INS),
          new compare.Diff(222, 17, compare.INS),
          new compare.Diff(245, 20, compare.INS),
          new compare.Diff(271, 19, compare.INS),
          new compare.Diff(296, 25, compare.INS),
          new compare.Diff(327, 14, compare.INS),
        ],
        inlines: [
          new compare.Diff(22, 1, compare.INS),
          new compare.Diff(44, 1, compare.INS),
          new compare.Diff(67, 1, compare.INS),
          new compare.Diff(93, 1, compare.INS),
          new compare.Diff(118, 1, compare.INS),
          new compare.Diff(149, 1, compare.INS),
          new compare.Diff(169, 1, compare.INS),
        ],
      },
    );
  });

  test("object compare 1", () => {
    expectEq(
      `{
    "foo": [
        {
            "OBJ_ID": "CN=Kate Smith,OU=Users,OU=Willow,DC=cloudaddc,DC=qalab,DC=cam,DC=novell,DC=com",
            "userAccountControl": "512",
            "objectGUID": "b3067a77-875b-4208-9ee3-39128adeb654",
            "lastLogon": "0",
            "sAMAccountName": "ksmith",
            "userPrincipalName": "ksmith@cloudaddc.qalab.cam.novell.com",
            "distinguishedName": "CN=Kate Smith,OU=Users,OU=Willow,DC=cloudaddc,DC=qalab,DC=cam,DC=novell,DC=com"
        },
        {
            "OBJ_ID": "CN=Timothy Swan,OU=Users,OU=Willow,DC=cloudaddc,DC=qalab,DC=cam,DC=novell,DC=com",
            "userAccountControl": "512",
            "objectGUID": "c3f7dae9-9b4f-4d55-a1ec-bf9ef45061c3",
            "lastLogon": "130766915788304915",
            "sAMAccountName": "tswan",
            "userPrincipalName": "tswan@cloudaddc.qalab.cam.novell.com",
            "distinguishedName": "CN=Timothy Swan,OU=Users,OU=Willow,DC=cloudaddc,DC=qalab,DC=cam,DC=novell,DC=com"
        }
    ]
}`,
      `[
    {
        "OBJ_ID": "CN=Timothy Swan,OU=Users,OU=Willow,DC=cloudaddc,DC=qalab,DC=cam,DC=novell,DC=com",
        "userAccountControl": "512",
        "objectGUID": "c3f7dae9-9b4f-4d55-a1ec-bf9ef45061c3",
        "lastLogon": "130766915788304915",
        "sAMAccountName": "tswan",
        "userPrincipalName": "tswan@cloudaddc.qalab.cam.novell.com",
        "distinguishedName": "CN=Timothy Swan,OU=Users,OU=Willow,DC=cloudaddc,DC=qalab,DC=cam,DC=novell,DC=com"
    }
]`,
      {
        hunks: [
          new compare.Diff(0, 1020, compare.DEL),
          new compare.Diff(0, 475, compare.INS),
        ],
      },
    );

    expectEq(
      `[
    {
        "OBJ_ID": "CN=Kate Smith,OU=Users,OU=Willow,DC=cloudaddc,DC=qalab,DC=cam,DC=novell,DC=com",
        "userAccountControl": "512",
        "objectGUID": "b3067a77-875b-4208-9ee3-39128adeb654",
        "lastLogon": "0",
        "sAMAccountName": "ksmith",
        "userPrincipalName": "ksmith@cloudaddc.qalab.cam.novell.com",
        "distinguishedName": "CN=Kate Smith,OU=Users,OU=Willow,DC=cloudaddc,DC=qalab,DC=cam,DC=novell,DC=com"
    },
    {
        "OBJ_ID": "CN=Timothy Swan,OU=Users,OU=Willow,DC=cloudaddc,DC=qalab,DC=cam,DC=novell,DC=com",
        "userAccountControl": "512",
        "objectGUID": "c3f7dae9-9b4f-4d55-a1ec-bf9ef45061c3",
        "lastLogon": "130766915788304915",
        "sAMAccountName": "tswan",
        "userPrincipalName": "tswan@cloudaddc.qalab.cam.novell.com",
        "distinguishedName": "CN=Timothy Swan,OU=Users,OU=Willow,DC=cloudaddc,DC=qalab,DC=cam,DC=novell,DC=com"
    }
]`,
      `{
    "foo": [
        {
            "OBJ_ID": "CN=Timothy Swan,OU=Users,OU=Willow,DC=cloudaddc,DC=qalab,DC=cam,DC=novell,DC=com",
            "userAccountControl": "512",
            "objectGUID": "c3f7dae9-9b4f-4d55-a1ec-bf9ef45061c3",
            "lastLogon": "130766915788304915",
            "sAMAccountName": "tswan",
            "userPrincipalName": "tswan@cloudaddc.qalab.cam.novell.com",
            "distinguishedName": "CN=Timothy Swan,OU=Users,OU=Willow,DC=cloudaddc,DC=qalab,DC=cam,DC=novell,DC=com"
        }
    ]
}`,
      {
        hunks: [
          new compare.Diff(0, 929, compare.DEL),
          new compare.Diff(0, 530, compare.INS),
        ],
      },
    );
  });

  test("object compare 2", () => {
    expectEq(
      `{
    "Aidan Gillen": {
        "array": [
            "Game of Thron\\"es",
            "The Wire"
        ],
        "string": "some string",
        "int": 2,
        "aboolean": true,
        "boolean": true,
        "null": null,
        "a_null": null,
        "another_null": "null check",
        "object": {
            "foo": "bar",
            "object1": {
                "new prop1": "new prop value"
            },
            "object2": {
                "new prop1": "new prop value"
            },
            "object3": {
                "new prop1": "new prop value"
            },
            "object4": {
                "new prop1": "new prop value"
            }
        }
    },
    "Amy Ryan": {
        "one": "In Treatment",
        "two": "The Wire"
    },
    "Annie Fitzgerald": [
        "Big Love",
        "True Blood"
    ],
    "Anwan Glover": [
        "Treme",
        "The Wire"
    ],
    "Alexander Skarsgard": [
        "Generation Kill",
        "True Blood"
    ],
    "Clarke Peters": null
}`,
      `{
    "Aidan Gillen": {
        "array": [
            "Game of Thrones",
            "The Wire"
        ],
        "string": "some string",
        "int": "2",
        "otherint": 4,
        "aboolean": "true",
        "boolean": false,
        "null": null,
        "a_null": 88,
        "another_null": null,
        "object": {
            "foo": "bar"
        }
    },
    "Amy Ryan": [
        "In Treatment",
        "The Wire"
    ],
    "Annie Fitzgerald": [
        "True Blood",
        "Big Love",
        "The Sopranos",
        "Oz"
    ],
    "Anwan Glover": [
        "Treme",
        "The Wire"
    ],
    "Alexander Skarsg?rd": [
        "Generation Kill",
        "True Blood"
    ],
    "Alice Farmer": [
        "The Corner",
        "Oz",
        "The Wire"
    ]
}`,
      {
        hunks: [
          new compare.Diff(55, 19, compare.DEL),
          new compare.Diff(158, 1, compare.DEL),
          new compare.Diff(181, 4, compare.DEL),
          new compare.Diff(206, 4, compare.DEL),
          new compare.Diff(252, 4, compare.DEL),
          new compare.Diff(282, 12, compare.DEL),
          new compare.Diff(354, 72, compare.DEL),
          new compare.Diff(440, 72, compare.DEL),
          new compare.Diff(526, 72, compare.DEL),
          new compare.Diff(612, 72, compare.DEL),
          new compare.Diff(718, 64, compare.DEL),
          new compare.Diff(838, 12, compare.DEL),
          new compare.Diff(927, 78, compare.DEL),
          new compare.Diff(1011, 21, compare.DEL),
          new compare.Diff(55, 17, compare.INS),
          new compare.Diff(156, 3, compare.INS),
          new compare.Diff(169, 13, compare.INS),
          new compare.Diff(204, 6, compare.INS),
          new compare.Diff(231, 5, compare.INS),
          new compare.Diff(278, 2, compare.INS),
          new compare.Diff(306, 4, compare.INS),
          new compare.Diff(390, 50, compare.INS),
          new compare.Diff(476, 12, compare.INS),
          new compare.Diff(518, 14, compare.INS),
          new compare.Diff(542, 4, compare.INS),
          new compare.Diff(623, 78, compare.INS),
          new compare.Diff(707, 78, compare.INS),
        ],
        inlines: [
          new compare.Diff(69, 1, compare.DEL),
          new compare.Diff(71, 3, compare.DEL),
          new compare.Diff(206, 3, compare.DEL),
          new compare.Diff(252, 4, compare.DEL),
          new compare.Diff(282, 1, compare.DEL),
          new compare.Diff(287, 7, compare.DEL),
          new compare.Diff(69, 2, compare.INS),
          new compare.Diff(156, 1, compare.INS),
          new compare.Diff(158, 1, compare.INS),
          new compare.Diff(204, 1, compare.INS),
          new compare.Diff(209, 1, compare.INS),
          new compare.Diff(231, 4, compare.INS),
          new compare.Diff(278, 2, compare.INS),
        ],
      },
    );
  });

  test("compare array 1", () => {
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
      {
        isTextCompare: false,
        hunks: [
          new compare.Diff(21, 1, compare.DEL),
          new compare.Diff(172, 15, compare.DEL),
          new compare.Diff(197, 15, compare.DEL),
          new compare.Diff(21, 1, compare.INS),
          new compare.Diff(172, 14, compare.INS),
          new compare.Diff(196, 14, compare.INS),
        ],
        inlines: [
          new compare.Diff(21, 1, compare.DEL),
          new compare.Diff(173, 12, compare.DEL),
          new compare.Diff(198, 13, compare.DEL),
          new compare.Diff(21, 1, compare.INS),
          new compare.Diff(173, 11, compare.INS),
          new compare.Diff(197, 12, compare.INS),
        ],
      },
    );
  });

  test("compare array 2", () => {
    expectEq(
      `[
    {
        "OBJ_ID": "CN=Kate Smith,OU=Users,OU=Willow,DC=cloudaddc,DC=qalab,DC=cam,DC=novell,DC=com",
        "userAccountControl": "512",
        "objectGUID": "b3067a77-875b-4208-9ee3-39128adeb654",
        "lastLogon": "0",
        "sAMAccountName": "ksmith",
        "userPrincipalName": "ksmith@cloudaddc.qalab.cam.novell.com",
        "distinguishedName": "CN=Kate Smith,OU=Users,OU=Willow,DC=cloudaddc,DC=qalab,DC=cam,DC=novell,DC=com"
    },
    {
        "OBJ_ID": "CN=Timothy Swan,OU=Users,OU=Willow,DC=cloudaddc,DC=qalab,DC=cam,DC=novell,DC=com",
        "userAccountControl": "512",
        "objectGUID": "c3f7dae9-9b4f-4d55-a1ec-bf9ef45061c3",
        "lastLogon": "130766915788304915",
        "sAMAccountName": "tswan",
        "userPrincipalName": "tswan@cloudaddc.qalab.cam.novell.com",
        "distinguishedName": "CN=Timothy Swan,OU=Users,OU=Willow,DC=cloudaddc,DC=qalab,DC=cam,DC=novell,DC=com"
    }
]`,
      `[
    {
        "OBJ_ID": "CN=Timothy Swan,OU=Users,OU=Willow,DC=cloudaddc,DC=qalab,DC=cam,DC=novell,DC=com",
        "userAccountControl": "512",
        "objectGUID": "c3f7dae9-9b4f-4d55-a1ec-bf9ef45061c3",
        "lastLogon": "130766915788304915",
        "sAMAccountName": "tswan",
        "userPrincipalName": "tswan@cloudaddc.qalab.cam.novell.com",
        "distinguishedName": "CN=Timothy Swan,OU=Users,OU=Willow,DC=cloudaddc,DC=qalab,DC=cam,DC=novell,DC=com"
    }
]`,
      {
        hunks: [
          new compare.Diff(6, 448, compare.DEL),
        ],
      },
    );
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
        {
          hunks: [
            new compare.Diff(14, 11, compare.DEL),
            new compare.Diff(14, 4, compare.INS),
          ],
          inlines: [
            new compare.Diff(14, 11, compare.DEL),
            new compare.Diff(14, 4, compare.INS),
          ],
        },
      );
    });

    test("viewzone error", () => {
      expectEq(`{

  return tokens;
}`, `{
  return tokens;
}`,
        {
          isTextCompare: true,
          hunks: [
            new compare.Diff(2, 1, compare.DEL),
          ],
        },
      );

      expectEq(
        `wordDiff.tokenize = function(value) {
  // All whitespace symbols except newline group into one token, each newline - in separate token
  let tokens = value.split(/([^\\S\\r\\n]+|[()[\\]{}'"\\r\\n]|\\b)/);

  // Join the boundary splits that we do not consider to be boundaries. This is primarily the extended Latin character set.
  for (let i = 0; i < tokens.length - 1; i++) {
    // If we have an empty string in the next field and we have only word chars before and after, merge
    if (!tokens[i + 1] && tokens[i + 2]
          && extendedWordChars.test(tokens[i])
          && extendedWordChars.test(tokens[i + 2])) {
      tokens[i] += tokens[i + 2];
      tokens.splice(i + 1, 2);
      i--;
    }
  }

  return tokens;
};`,
        `wordDiff.tokenize = function(value) {
  const tokens = [];
  let prevCharType = '';
  for (let i = 0; i < value.length; i++) {
    const char = value[i];
    if (spaceRegExp.test(char)) {
      if(prevCharType === 'space') {
        tokens[tokens.length - 1] += ' ';
      } else {
        tokens.push(' ');
      }
      prevCharType = 'space';
    } else if (cannotBecomeWordRegExp.test(char)) {
      tokens.push(char);
      prevCharType = '';
    } else {
      if(prevCharType === 'word') {
        tokens[tokens.length - 1] += char;
      } else {
        tokens.push(char);
      }
      prevCharType = 'word';
    }
  }
  return tokens;
};`,
        {
          isTextCompare: true,
          hunks: [
            new compare.Diff(38, 654, compare.DEL),
            new compare.Diff(703, 1, compare.DEL),
            new compare.Diff(38, 580, compare.INS),
          ],
        },
      );
    });

    test("diff error", () => {
      expectEq(
        `hello


b
    }
  }

  return tokens;
};`,
        `world
  
a
c
            } ;
        }
    } return tokens;
};`,
        {
          isTextCompare: true,
          hunks: [
            new compare.Diff(0, 5, compare.DEL),
            new compare.Diff(7, 2, compare.DEL),
            new compare.Diff(16, 21, compare.DEL),
            new compare.Diff(0, 5, compare.INS),
            new compare.Diff(9, 19, compare.INS),
            new compare.Diff(39, 20, compare.INS),
          ],
        },
      );
    });

    test("diff error 2", () => {
      expectEq(
        `[
    {
        "recharge": 9642800000
    },
    {
        "available": 19700000
    }
]`,
        `[
    {
        "recharge": 900000
    },
    {
        "available": 0
    }
]`,
        {
          hunks: [
            new compare.Diff(28, 10, compare.DEL),
            new compare.Diff(73, 8, compare.DEL),
            new compare.Diff(28, 6, compare.INS),
            new compare.Diff(69, 1, compare.INS),
          ],
        },
      );
    });
  });
});
