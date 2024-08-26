import { getConfig } from "@/lib/db/config";
import { parseJSON } from "@/lib/parser";

// 将 python dict 转成 JSON
export async function pythonDictToJSON(text: string) {
  const options = (await getConfig()).parseOptions;
  text = text
    .replace(/,\s*\}(\W*?)/gm, "}$1")
    .replace(/,\s*\](\W*?)/gm, "]$1")
    .replace(/(\W*?)'/gm, '$1"')
    .replace(/'(\W*?)/gm, '"$1')
    .replace(/\bTrue\b/gm, "true")
    .replace(/\bFalse\b/gm, "false")
    .replace(/\bNone\b/gm, "null");
  const tree = parseJSON(text, options);
  return tree.valid() ? tree.stringify(options) : text;
}
