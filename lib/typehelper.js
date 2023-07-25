export function isNumber(v) {
  return ["number", "bigint"].includes(typeof v);
}

// NOTICE: typeof null === 'object'
export function isBaseType(v) {
  return v === null || ["undefined", "number", "string", "boolean", "bigint"].includes(typeof v);
}

export function isObject(v) {
  return !isBaseType(v) && !Array.isArray(v) && typeof v === "object";
}
