import { compareTree, compareText } from "@/lib/command/compare";
import { newDiff, Diff, sort } from "@/lib/compare";
import { parseJSON } from "@/lib/parser";
import { readFileIfNeed } from "./utils";

function expectEq(
  ltext: string,
  rtext: string,
  { hunks, inlines, isTextCompare }: { hunks?: Diff[]; inlines?: Diff[]; isTextCompare?: boolean },
) {
  ltext = readFileIfNeed(ltext);
  rtext = readFileIfNeed(rtext);

  let pairs;

  if (isTextCompare) {
    pairs = compareText(ltext, rtext);
  } else {
    const ltree = parseJSON(ltext);
    const rtree = parseJSON(rtext);
    pairs = compareTree(ltree, rtree);
  }

  const gotInlineDiffs = sort(
    pairs
      .map(({ left, right }) => (left?.inlineDiffs ?? []).concat(right?.inlineDiffs ?? []))
      .reduce((a, b) => a.concat(b), []),
  );
  const gotHunkDiffs = sort(
    pairs
      .map(({ left, right }) => {
        left && delete left.inlineDiffs;
        right && delete right.inlineDiffs;
        return [left, right];
      })
      .reduce((a, b) => a.concat(b), [])
      .filter((a) => a) as Diff[],
  );

  expect(hunks !== undefined || inlines !== undefined || isTextCompare !== undefined).toEqual(true);

  if (hunks) {
    expect(gotHunkDiffs).toMatchObject(hunks);
  }
  if (inlines) {
    expect(gotInlineDiffs).toMatchObject(inlines);
  }
}

describe("Comparer", () => {
  test("diffVal", () => {
    expectEq('{ "foo": "abc" }', '{ "foo": "adc" }', {
      inlines: [newDiff(11, 1, "del"), newDiff(11, 1, "ins")],
    });
  });

  test("diffArray", () => {
    expectEq('[ "foo", "abc" ]', '[ "foo", "adc" ]', {
      inlines: [newDiff(11, 1, "del"), newDiff(11, 1, "ins")],
    });

    expectEq("[12, 34]", "[12, 23, 34]", {
      hunks: [newDiff(5, 2, "ins")],
    });

    expectEq(
      `[
    12345678987654321,
    0.1234567891111111111,
    1,
    2,
    3
]`,
      `[
    12345678987654320,
    0.1234567891111111110,
    2,
    3,
    1
]`,
      {
        hunks: [
          newDiff(6, 17, "del"),
          newDiff(29, 21, "del"),
          newDiff(56, 1, "del"),
          newDiff(6, 17, "ins"),
          newDiff(29, 21, "ins"),
          newDiff(70, 1, "ins"),
        ],
        inlines: [newDiff(22, 1, "del"), newDiff(49, 1, "del"), newDiff(22, 1, "ins"), newDiff(49, 1, "ins")],
      },
    );
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
          newDiff(43, 33, "del"),
          newDiff(144, 68, "del"),
          newDiff(235, 61, "del"),
          newDiff(317, 368, "del"),
          newDiff(703, 81, "del"),
          newDiff(831, 20, "del"),
          newDiff(924, 28, "del"),
          newDiff(1008, 25, "del"),
          newDiff(43, 30, "ins"),
          newDiff(141, 96, "ins"),
          newDiff(260, 51, "ins"),
          newDiff(332, 24, "ins"),
          newDiff(374, 67, "ins"),
          newDiff(468, 21, "ins"),
          newDiff(510, 36, "ins"),
          newDiff(619, 28, "ins"),
          newDiff(703, 82, "ins"),
        ],
        inlines: [
          newDiff(69, 2, "del"),
          newDiff(72, 3, "del"),
          newDiff(207, 3, "del"),
          newDiff(253, 4, "del"),
          newDiff(283, 1, "del"),
          newDiff(288, 7, "del"),
          newDiff(341, 344, "del"),
          newDiff(719, 1, "del"),
          newDiff(730, 7, "del"),
          newDiff(761, 7, "del"),
          newDiff(782, 1, "del"),
          newDiff(841, 2, "del"),
          newDiff(845, 5, "del"),
          newDiff(945, 1, "del"),
          newDiff(1013, 5, "del"),
          newDiff(1020, 6, "del"),
          newDiff(1029, 4, "del"),
          newDiff(69, 2, "ins"),
          newDiff(156, 1, "ins"),
          newDiff(158, 1, "ins"),
          newDiff(170, 23, "ins"),
          newDiff(204, 1, "ins"),
          newDiff(209, 1, "ins"),
          newDiff(231, 4, "ins"),
          newDiff(278, 2, "ins"),
          newDiff(390, 1, "ins"),
          newDiff(439, 1, "ins"),
          newDiff(520, 1, "ins"),
          newDiff(523, 8, "ins"),
          newDiff(532, 1, "ins"),
          newDiff(534, 13, "ins"),
          newDiff(640, 1, "ins"),
          newDiff(708, 4, "ins"),
          newDiff(714, 6, "ins"),
          newDiff(723, 1, "ins"),
          newDiff(725, 61, "ins"),
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
          newDiff(15, 17, "del"),
          newDiff(38, 14, "del"),
          newDiff(77, 17, "del"),
          newDiff(104, 21, "del"),
          newDiff(135, 1, "del"),
          newDiff(15, 17, "ins"),
          newDiff(38, 14, "ins"),
          newDiff(77, 17, "ins"),
          newDiff(104, 21, "ins"),
          newDiff(157, 1, "ins"),
        ],
        inlines: [
          newDiff(31, 1, "del"),
          newDiff(93, 1, "del"),
          newDiff(124, 1, "del"),
          newDiff(31, 1, "ins"),
          newDiff(93, 1, "ins"),
          newDiff(124, 1, "ins"),
        ],
      },
    );
  });

  test("char compare", () => {
    expectEq("", "", {
      hunks: [],
      inlines: [],
      isTextCompare: true,
    });

    expectEq('  "foo": "abc" }', '{ "foo": "adc" }', {
      inlines: [newDiff(0, 1, "del"), newDiff(11, 1, "del"), newDiff(0, 1, "ins"), newDiff(11, 1, "ins")],
      isTextCompare: true,
    });
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
        inlines: [newDiff(6, 1, "del"), newDiff(15, 1, "del"), newDiff(6, 1, "ins"), newDiff(15, 1, "ins")],
        isTextCompare: true,
      },
    );
  });

  // stolen from https://github.com/zgrossbart/jdd/blob/main/jdd_test.js
  test("inconsistent type", () => {
    expectEq('{ "akey": [] }', '{ "akey": null }', {
      hunks: [newDiff(10, 2, "del"), newDiff(10, 4, "ins")],
    });

    expectEq('{ "akey": null }', '{ "akey": [] }', {
      hunks: [newDiff(10, 4, "del"), newDiff(10, 2, "ins")],
    });

    expectEq('{ "akey": {} }', '{ "akey": null }', {
      hunks: [newDiff(10, 2, "del"), newDiff(10, 4, "ins")],
    });

    expectEq('{ "akey": null }', '{ "akey": {} }', {
      hunks: [newDiff(10, 4, "del"), newDiff(10, 2, "ins")],
    });
  });

  test("simple compare", () => {
    expectEq("12345", "", {
      isTextCompare: true,
      hunks: [newDiff(0, 5, "del")],
    });

    expectEq("", "12345", {
      isTextCompare: true,
      hunks: [newDiff(0, 5, "ins")],
    });

    expectEq("a", "a2345", {
      isTextCompare: true,
      hunks: [newDiff(0, 1, "del"), newDiff(0, 5, "ins")],
      inlines: [newDiff(1, 4, "ins")],
    });

    expectEq(
      '{"link": "<a href=\\"http://google.com/\\">Google</a>"}',
      '{"link": "<a href=\\"http://googlex.com/\\">Google</a>"}',
      { inlines: [newDiff(33, 1, "ins")] },
    );

    expectEq(
      '{"editor.detectIndentation": false,"editor.tabSize": 2,"files.exclude": {".vscode/": true,"foo": "bar"}}',
      '{"editor.detectIndentation": false,"editor.tabSize": 2,"files.exclude": {".slash/": true,"foo": "bar"}}',
      { hunks: [newDiff(73, 16, "del"), newDiff(73, 15, "ins")] },
    );

    expectEq(
      '{"editor.detectIndentation": false,"editor.tabSize": 2,"files.exclude": {"bas":".vscode/","foo": "bar"}}',
      '{"editor.detectIndentation": false,"editor.tabSize": 2,"files.exclude": {"bas":".slash/","foo": "bar"}}',
      {
        inlines: [newDiff(81, 6, "del"), newDiff(81, 5, "ins")],
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
          newDiff(17, 6, "del"),
          newDiff(38, 6, "del"),
          newDiff(60, 6, "del"),
          newDiff(85, 6, "del"),
          newDiff(109, 6, "del"),
          newDiff(139, 6, "del"),
          newDiff(158, 6, "del"),
          newDiff(193, 15, "del"),
          newDiff(214, 16, "del"),
          newDiff(236, 19, "del"),
          newDiff(261, 18, "del"),
          newDiff(285, 24, "del"),
          newDiff(315, 13, "del"),
          newDiff(17, 7, "ins"),
          newDiff(39, 7, "ins"),
          newDiff(62, 7, "ins"),
          newDiff(88, 7, "ins"),
          newDiff(113, 7, "ins"),
          newDiff(144, 7, "ins"),
          newDiff(164, 7, "ins"),
          newDiff(200, 16, "ins"),
          newDiff(222, 17, "ins"),
          newDiff(245, 20, "ins"),
          newDiff(271, 19, "ins"),
          newDiff(296, 25, "ins"),
          newDiff(327, 14, "ins"),
        ],
        inlines: [
          newDiff(22, 1, "ins"),
          newDiff(44, 1, "ins"),
          newDiff(67, 1, "ins"),
          newDiff(93, 1, "ins"),
          newDiff(118, 1, "ins"),
          newDiff(149, 1, "ins"),
          newDiff(169, 1, "ins"),
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
        hunks: [newDiff(0, 1020, "del"), newDiff(0, 475, "ins")],
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
        hunks: [newDiff(0, 929, "del"), newDiff(0, 530, "ins")],
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
          newDiff(55, 19, "del"),
          newDiff(158, 1, "del"),
          newDiff(181, 4, "del"),
          newDiff(206, 4, "del"),
          newDiff(252, 4, "del"),
          newDiff(282, 12, "del"),
          newDiff(354, 72, "del"),
          newDiff(440, 72, "del"),
          newDiff(526, 72, "del"),
          newDiff(612, 72, "del"),
          newDiff(718, 64, "del"),
          newDiff(838, 12, "del"),
          newDiff(927, 78, "del"),
          newDiff(1011, 21, "del"),
          newDiff(55, 17, "ins"),
          newDiff(156, 3, "ins"),
          newDiff(169, 13, "ins"),
          newDiff(204, 6, "ins"),
          newDiff(231, 5, "ins"),
          newDiff(278, 2, "ins"),
          newDiff(306, 4, "ins"),
          newDiff(390, 50, "ins"),
          newDiff(476, 12, "ins"),
          newDiff(518, 14, "ins"),
          newDiff(542, 4, "ins"),
          newDiff(623, 78, "ins"),
          newDiff(707, 78, "ins"),
        ],
        inlines: [newDiff(69, 1, "del"), newDiff(71, 3, "del"), newDiff(69, 2, "ins")],
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
          newDiff(21, 1, "del"),
          newDiff(172, 15, "del"),
          newDiff(197, 15, "del"),
          newDiff(21, 1, "ins"),
          newDiff(172, 14, "ins"),
          newDiff(196, 14, "ins"),
        ],
        inlines: [
          newDiff(21, 1, "del"),
          newDiff(173, 12, "del"),
          newDiff(198, 13, "del"),
          newDiff(21, 1, "ins"),
          newDiff(173, 11, "ins"),
          newDiff(197, 12, "ins"),
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
        hunks: [newDiff(6, 448, "del")],
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
          hunks: [newDiff(14, 11, "del"), newDiff(14, 4, "ins")],
          inlines: [],
        },
      );
    });

    test("viewzone error", () => {
      expectEq(
        `{

  return tokens;
}`,
        `{
  return tokens;
}`,
        {
          isTextCompare: true,
          hunks: [newDiff(2, 1, "del")],
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
          hunks: [newDiff(38, 654, "del"), newDiff(703, 1, "del"), newDiff(38, 580, "ins")],
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
            newDiff(0, 5, "del"),
            newDiff(7, 2, "del"),
            newDiff(16, 21, "del"),
            newDiff(0, 5, "ins"),
            newDiff(7, 19, "ins"),
            newDiff(37, 20, "ins"),
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
          hunks: [newDiff(28, 10, "del"), newDiff(73, 8, "del"), newDiff(28, 6, "ins"), newDiff(69, 1, "ins")],
        },
      );
    });

    test("diff error 3", () => {
      expectEq("region_and_currency1.txt", "region_and_currency2.txt", { isTextCompare: true });
    });
  });
});
