import { genDate } from "@/lib/date/index";

describe("genDate", () => {
  test("parses valid ISO date string", () => {
    const date = genDate("2023-10-05");
    expect(date.getFullYear()).toBe(2023);
    expect(date.getMonth()).toBe(9);
    expect(date.getDate()).toBe(5);
  });

  test("parses ISO date with time", () => {
    const date = genDate("2023-10-05T14:30:00");
    expect(date.getHours()).toBe(14);
    expect(date.getMinutes()).toBe(30);
    expect(date.getSeconds()).toBe(0);
  });

  test("parses date with different separators", () => {
    const date = genDate("2023/10/05");
    expect(date.getFullYear()).toBe(2023);
    expect(date.getMonth()).toBe(9);
    expect(date.getDate()).toBe(5);
  });

  test("handles invalid date string", () => {
    const date = genDate("invalid-date");
    expect(date.getTime()).toBeNaN();
  });

  test("handles empty string input", () => {
    const date = genDate("");
    expect(date.getTime()).toBeNaN();
  });

  test("parses date with timezone offset", () => {
    const date = genDate("2023-10-05T14:30:00+02:30");
    expect(date.getUTCHours()).toBe(12);
    expect(date.getMinutes()).toBe(0);
  });

  test("parses a 10-digit timestamp (seconds)", () => {
    const date = genDate("1672531200"); // 2023-01-01 00:00:00 UTC
    expect(date.getUTCFullYear()).toBe(2023);
    expect(date.getUTCMonth()).toBe(0);
    expect(date.getUTCDate()).toBe(1);
    expect(date.getUTCHours()).toBe(0);
    expect(date.getUTCMinutes()).toBe(0);
    expect(date.getUTCSeconds()).toBe(0);
  });

  test("parses a 13-digit timestamp (milliseconds)", () => {
    const date = genDate("1672531200000"); // 2023-01-01 00:00:00 UTC
    expect(date.getUTCFullYear()).toBe(2023);
    expect(date.getUTCMonth()).toBe(0);
    expect(date.getUTCDate()).toBe(1);
    expect(date.getUTCHours()).toBe(0);
    expect(date.getUTCMinutes()).toBe(0);
    expect(date.getUTCSeconds()).toBe(0);
  });
});
