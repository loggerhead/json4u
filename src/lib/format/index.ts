import { type ParseOptions, getGenTabsFn } from "@/lib/parser";

// stolen from https://github.com/zgrossbart/jdd/blob/main/jsl/jsl.format.js
export function format(json: string, options?: ParseOptions): string {
  const genTabs = getGenTabsFn(options?.tabWidth || 2);
  let i = 0;
  let il = 0;
  let newJson = "";
  let indentLevel = 0;
  let inString = false;
  let c = null;

  for (i = 0, il = json.length; i < il; i += 1) {
    c = json.charAt(i);

    if (c === '"') {
      // if not \"
      if (i > 0 && json.charAt(i - 1) !== "\\") {
        inString = !inString;
      }
      newJson += c;
      continue;
    } else if (inString) {
      newJson += c;
      continue;
    }

    switch (c) {
      case "{":
      case "[":
        newJson += c + "\n" + genTabs(indentLevel + 1);
        indentLevel += 1;
        break;
      case "}":
      case "]":
        indentLevel -= 1;
        newJson += "\n" + genTabs(indentLevel) + c;
        break;
      case ",":
        newJson += ",\n" + genTabs(indentLevel);
        break;
      case ":":
        newJson += ": ";
        break;
      case " ":
      case "\n":
      case "\t":
        break;
      default:
        newJson += c;
        break;
    }
  }

  return newJson.trim();
}
