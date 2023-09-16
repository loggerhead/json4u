import { Range, sortRanges, uniqRanges, mergeLineRanges, generateFillRanges } from "../lib/compare/range";

describe("ranges util", () => {
  test("sortRanges", () => {
    const tt = [
      [[], []],
      [[new Range(3, 3)], [new Range(3, 3)]],
      [
        [new Range(3, 3), new Range(1, 1), new Range(2, 2)],
        [new Range(1, 1), new Range(2, 2), new Range(3, 3)],
      ],
    ];

    for (const [input, expected] of tt) {
      expect(sortRanges(input)).toEqual(expected);
    }
  });

  test("uniqRanges", () => {
    const tt = [
      [[], []],
      [[new Range(3, 3)], [new Range(3, 3)]],
      [
        [new Range(3, 3), new Range(1, 1), new Range(3, 3)],
        [new Range(3, 3), new Range(1, 1)],
      ],
    ];

    for (const [input, expected] of tt) {
      expect(uniqRanges(input)).toEqual(expected);
    }
  });

  test("mergeLineRanges", () => {
    const tt = [
      [[], []],
      [[new Range(3, 3)], [new Range(3, 3)]],
      [[new Range(1, 1), new Range(2, 2), new Range(3, 3)], [new Range(1, 3)]],
      [[new Range(1, 2), new Range(3, 4)], [new Range(1, 4)]],
      [[new Range(1, 3), new Range(3, 4)], [new Range(1, 4)]],
      [[new Range(1, 3), new Range(2, 4)], [new Range(1, 4)]],
      [[new Range(1, 2), new Range(3, 3), new Range(4, 5)], [new Range(1, 5)]],
      [
        [new Range(1, 2), new Range(4, 5)],
        [new Range(1, 2), new Range(4, 5)],
      ],
      [
        [new Range(1, 10), new Range(5, 25), new Range(40, 50)],
        [new Range(1, 25), new Range(40, 50)],
      ],
    ];

    for (const [input, expected] of tt) {
      expect(new mergeLineRanges(input)).toEqual(expected);
    }
  });

  test("generateFillRanges", () => {
    const tt = [
      [[], [], [], []],
      [[new Range(3, 3)], [], [new Range(3, 3)], []],
      [[], [new Range(3, 3)], [], [new Range(3, 3)]],
      // [   ]
      //       [   ]
      [[new Range(1, 3)], [new Range(5, 7)], [new Range(1, 3)], [new Range(5, 7)]],
      [[new Range(5, 7)], [new Range(1, 3)], [new Range(5, 7)], [new Range(1, 3)]],
      // [   ]
      //   [   ]
      [[new Range(1, 5)], [new Range(3, 7)], [new Range(1, 2)], [new Range(6, 7)]],
      [[new Range(3, 7)], [new Range(1, 5)], [new Range(6, 7)], [new Range(1, 2)]],
      //   [  ]
      // [       ]
      [[new Range(3, 5)], [new Range(1, 7)], [], [new Range(1, 2), new Range(6, 7)]],
      [[new Range(1, 7)], [new Range(3, 5)], [new Range(1, 2), new Range(6, 7)], []],
      //  [ ] [ ]
      // [        ]
      [[new Range(2, 3), new Range(5, 6)], [new Range(1, 7)], [], [new Range(1, 1), new Range(4, 4), new Range(7, 7)]],
      [[new Range(1, 7)], [new Range(2, 3), new Range(5, 6)], [new Range(1, 1), new Range(4, 4), new Range(7, 7)], []],
      //  [ ] [ ] [  ]
      // [         ]
      [
        [new Range(2, 3), new Range(5, 6), new Range(8, 10)],
        [new Range(1, 9)],
        [new Range(10, 10)],
        [new Range(1, 1), new Range(4, 4), new Range(7, 7)],
      ],
    ];

    for (const [leftRanges, rightRanges, leftExtras, rightExtras] of tt) {
      expect(generateFillRanges(leftRanges, rightRanges)).toEqual([leftExtras, rightExtras]);
    }
  });

  test("generateFillRanges case 1", () => {
    expect(
      generateFillRanges(
        [new Range(13, 24), new Range(26, 27), new Range(35, 36)],
        [new Range(13, 14), new Range(24, 27), new Range(37, 41)]
      )
    ).toEqual([
      [new Range(37, 38), new Range(46, 50)],
      [new Range(15, 24), new Range(17, 17)],
    ]);
  });
});
