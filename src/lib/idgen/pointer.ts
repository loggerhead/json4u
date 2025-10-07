export const rootMarker = "$";

/**
 * Escapes a key for use in a JSON pointer.
 * @param key - The key to escape.
 * @returns The escaped key.
 */
export function escape(key: string | number): string {
  return String(key)
    .replace(/~/g, "~0")
    .replace(/\//g, "~1")
    .replace(/["%\s&$]/g, encodeURIComponent);
}

/**
 * Unescapes a key from a JSON pointer.
 * @param key - The key to unescape.
 * @returns The unescaped key.
 */
export function unescape(key: string): string {
  return key
    .replace(/~1/g, "/")
    .replace(/~0/g, "~")
    .replace(/%[0-9A-F]{2}/g, decodeURIComponent);
}

/**
 * Converts a JSON pointer to a JSON path.
 * @param pointer - The JSON pointer.
 * @returns The JSON path.
 */
export function toPath(pointer: string): string[] {
  if (pointer === rootMarker) {
    return [];
  } else {
    return pointer.substring(2).split("/").map(unescape);
  }
}

/**
 * Converts a JSON path to a JSON pointer.
 * @param path - The JSON path.
 * @returns The JSON pointer.
 */
export function toPointer(path: (string | number)[]): string {
  if (path.length === 0) {
    return rootMarker;
  } else {
    return rootMarker + "/" + path.map(escape).join("/");
  }
}

/**
 * Joins a parent pointer and children keys into a new pointer.
 * @param parentPointer - The parent pointer.
 * @param childrenKeys - The children keys.
 * @returns The new pointer.
 */
export function join(parentPointer: string, ...childrenKeys: string[]): string {
  return [parentPointer, ...childrenKeys.map(escape)].join("/");
}

/**
 * Splits a pointer into its parent and last key.
 * @param pointer - The pointer to split.
 * @returns The parent and last key.
 */
export function splitParentPointer(pointer: string) {
  const pp = pointer.split("/");
  const parent = pp.slice(0, -1).join("/");
  const lastKey = unescape(pp[pp.length - 1]);
  return { parent: parent || undefined, lastKey };
}

/**
 * Gets the JSON pointer of the parent of a given JSON node.
 * @param id - The JSON pointer of the node.
 * @returns The JSON pointer of the parent node.
 */
export function getParentId(id: string) {
  const { parent } = splitParentPointer(id);
  return parent;
}

export function isChild(parentId: string, childId: string) {
  return parentId === getParentId(childId);
}

/**
 * Checks if a pointer is a descendant of another pointer.
 * @param parentPointer - The parent pointer.
 * @param childPointer - The child pointer.
 * @returns True if the child pointer is a descendant of the parent pointer, false otherwise.
 */
export function isDescendant(parentPointer: string, childPointer: string) {
  return childPointer === parentPointer || childPointer.startsWith(parentPointer + "/");
}

/**
 * Gets the last key of a pointer.
 * @param pointer - The pointer.
 * @returns The last key.
 */
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
