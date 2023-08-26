// 对 JSON 字符串做转义
export function escapeJSON(text) {
  return text
    .replace(/[\\]/g, "\\\\")
    .replace(/[\"]/g, '\\"')
    .replace(/[\/]/g, "\\/")
    .replace(/[\b]/g, "\\b")
    .replace(/[\f]/g, "\\f")
    .replace(/[\n]/g, "\\n")
    .replace(/[\r]/g, "\\r")
    .replace(/[\t]/g, "\\t");
}

// 对 JSON 字符串做反转义
export function unescapeJSON(text) {
  return text
    .replace(/[\\]n/g, "\n")
    .replace(/[\\]'/g, "'")
    .replace(/[\\]"/g, '"')
    .replace(/[\\]&/g, "&")
    .replace(/[\\]r/g, "\r")
    .replace(/[\\]t/g, "\t")
    .replace(/[\\]b/g, "\b")
    .replace(/[\\]f/g, "\f");
}

export function escapeHTML(str) {
  return str.replace(
    /[&<>'"]/g,
    (tag) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        "'": "&#39;",
        '"': "&quot;",
      }[tag])
  );
}

export function unescapeHTML(str) {
  return str.replace(
    /&(\D+);/gi,
    (tag) =>
      ({
        "&amp;": "&",
        "&lt;": "<",
        "&gt;": ">",
        "&#39;": "'",
        "&quot;": '"',
      }[tag])
  );
}
