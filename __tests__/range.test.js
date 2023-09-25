import * as compare from "../lib/compare";

describe("generateFillRanges", () => {
  test("object case 1", () => {
    const hunkDiffs = [
      {
        "type": "delete",
        "range": {
          "startLineNumber": 4,
          "endLineNumber": 4,
        },
      },
      {
        "type": "insert",
        "range": {
          "startLineNumber": 4,
          "endLineNumber": 4,
        },
      },
      {
        "type": "delete",
        "range": {
          "startLineNumber": 8,
          "endLineNumber": 10,
        },
      },
      {
        "type": "insert",
        "range": {
          "startLineNumber": 8,
          "endLineNumber": 11,
        },
      },
      {
        "type": "delete",
        "range": {
          "startLineNumber": 12,
          "endLineNumber": 13,
        },
      },
      {
        "type": "insert",
        "range": {
          "startLineNumber": 13,
          "endLineNumber": 14,
        },
      },
      {
        "type": "delete",
        "range": {
          "startLineNumber": 15,
          "endLineNumber": 27,
        },
      },
      {
        "type": "insert",
        "range": {
          "startLineNumber": 16,
          "endLineNumber": 16,
        },
      },
      {
        "type": "delete",
        "range": {
          "startLineNumber": 30,
          "endLineNumber": 33,
        },
      },
      {
        "type": "insert",
        "range": {
          "startLineNumber": 19,
          "endLineNumber": 22,
        },
      },
      {
        "type": "insert",
        "range": {
          "startLineNumber": 24,
          "endLineNumber": 24,
        },
      },
      {
        "type": "delete",
        "range": {
          "startLineNumber": 36,
          "endLineNumber": 36,
        },
      },
      {
        "type": "insert",
        "range": {
          "startLineNumber": 26,
          "endLineNumber": 27,
        },
      },
      {
        "type": "delete",
        "range": {
          "startLineNumber": 42,
          "endLineNumber": 42,
        },
      },
      {
        "type": "insert",
        "range": {
          "startLineNumber": 33,
          "endLineNumber": 33,
        },
      },
      {
        "type": "delete",
        "range": {
          "startLineNumber": 46,
          "endLineNumber": 46,
        },
      },
      {
        "type": "insert",
        "range": {
          "startLineNumber": 37,
          "endLineNumber": 41,
        },
      },
    ];

    const leftFills = [
      {
        "startLineNumber": 11,
        "endLineNumber": 11,
      },
      {
        "startLineNumber": 35,
        "endLineNumber": 35,
      },
      {
        "startLineNumber": 37,
        "endLineNumber": 37,
      },
      {
        "startLineNumber": 47,
        "endLineNumber": 50,
      },
    ];

    const rightFills = [
      {
        "startLineNumber": 17,
        "endLineNumber": 28,
      },
    ];

    const [leftGot, rightGot] = compare.generateFillRanges(hunkDiffs);
    expect(leftGot).toMatchObject(leftFills);
    expect(rightGot).toMatchObject(rightFills);
  });
});
