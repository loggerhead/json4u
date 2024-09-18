export const rootMarker = "$";

export function escape(key: string | number): string {
  return String(key)
    .replace(/~/g, "~0")
    .replace(/\//g, "~1")
    .replace(/["%\s&$]/g, encodeURIComponent);
}

export function unescape(key: string): string {
  return key
    .replace(/~1/g, "/")
    .replace(/~0/g, "~")
    .replace(/%[0-9A-F]{2}/g, decodeURIComponent);
}

export function toPath(pointer: string): string[] {
  if (pointer === rootMarker) {
    return [];
  } else {
    return pointer.substring(2).split("/").map(unescape);
  }
}

export function toPointer(path: (string | number)[]): string {
  if (path.length === 0) {
    return rootMarker;
  } else {
    return rootMarker + "/" + path.map(escape).join("/");
  }
}

export function join(parentPointer: string, ...childrenKeys: string[]): string {
  return [parentPointer, ...childrenKeys.map(escape)].join("/");
}

export function splitParentPointer(pointer: string) {
  const pp = pointer.split("/");
  const parent = pp.slice(0, -1).join("/");
  const lastKey = unescape(pp[pp.length - 1]);
  return { parent: parent || undefined, lastKey };
}

export function isParent(parentPointer: string, childPointer: string) {
  const { parent } = splitParentPointer(childPointer);
  return parent === parentPointer;
}

export function lastKey(pointer: string) {
  const { lastKey } = splitParentPointer(pointer);
  return lastKey;
}

if (import.meta.vitest) {
  const { it, expect } = import.meta.vitest;

  function expectEq(path: string[]) {
    const escaped = toPointer(path);
    const unescaped = toPath(escaped);
    expect(path).toEqual(unescaped);
  }

  it("whitespace", () => {
    expectEq(["~0", "1 \t\n2", '"3']);
  });

  it("special chars", () => {
    expectEq([""]);
    expectEq(['"']);
    expectEq(["&"]);
    expectEq(["/"]);
    expectEq(["$"]);
  });

  it("splitParentPointer", () => {
    expect(splitParentPointer("")).toEqual({ parent: undefined, lastKey: "" });
    expect(splitParentPointer("$")).toEqual({ parent: undefined, lastKey: "$" });
    expect(splitParentPointer("$/")).toEqual({ parent: "$", lastKey: "" });
  });
}
