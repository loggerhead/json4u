export function escape(s) {
  return s.toString().replace(/~/g, "~0").replace(/\//g, "~1");
}

export function toPointer(path) {
  if (path?.length === 0) {
    return "";
  }
  return "/" + path.map(escape).join("/");
}
