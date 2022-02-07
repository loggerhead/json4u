export function isNumber(v: any): boolean {
  return ["number", "bigint"].includes(typeof v);
}

// NOTICE: typeof null === 'object'
export function isBaseType(v: any): boolean {
  return v === null || ["undefined", "number", "string", "boolean", "bigint"].includes(typeof v);
}

export function isObject(v: any): boolean {
  return !isBaseType(v) && !Array.isArray(v) && typeof v === "object";
}

export function isComparable(a: any, b: any): boolean {
  if (isNumber(a) && isNumber(b)) {
    return true;
  } else if (typeof a !== typeof b) {
    return false;
  }

  return isObject(a) === isObject(b);
}
