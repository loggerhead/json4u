// 对 JSON 字符串做转义
export function escape(text: string) {
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
export function unescape(text: string) {
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
