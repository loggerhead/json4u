export function escape(text: string) {
  return (
    text
      .replace(/[\\]/g, "\\\\")
      .replace(/[\"]/g, '\\"')
      .replace(/[\/]/g, "\\/")
      .replace(/[\b]/g, "\\b")
      .replace(/[\f]/g, "\\f")
      // FIXME: 换行符会被转义成 \n
      .replace(/[\n]/g, "\\n")
      .replace(/[\r]/g, "\\r")
      .replace(/[\t]/g, "\\t")
  );
}

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
