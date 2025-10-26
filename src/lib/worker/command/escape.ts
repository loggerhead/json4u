const ESCAPE_MAP: Record<string, string> = {
  "\\": "\\\\",
  '"': '\\"',
  "\b": "\\b",
  "\f": "\\f",
  "\n": "\\n",
  "\r": "\\r",
  "\t": "\\t",
};

const UNESCAPE_MAP: Record<string, string> = {
  b: "\b",
  f: "\f",
  n: "\n",
  r: "\r",
  t: "\t",
  '"': '"',
  "\\": "\\",
};

const ESCAPE_RE = /[\\"\u0000-\u001F\/]/g;
const UNESCAPE_RE = /(\\+)(.)/g;

export function escape(text: string): string {
  return text.replace(ESCAPE_RE, (ch) => ESCAPE_MAP[ch] || ch);
}

export function unescape(text: string): string {
  return text.replace(UNESCAPE_RE, (_m, bs, c) => {
    const cnt = bs.length,
      half = cnt >> 1;
    const prefix = "\\".repeat(half);
    return cnt % 2 === 1 && UNESCAPE_MAP[c] !== undefined
      ? prefix + UNESCAPE_MAP[c]
      : prefix + (cnt % 2 ? "\\" : "") + c;
  });
}
