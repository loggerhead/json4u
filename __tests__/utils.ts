import fs from "fs";
import path from "path";

export function readFileIfNeed(fileNameOrText: string) {
  if (/(\w+\/)*\w+\.(json|txt)/.test(fileNameOrText)) {
    const baseDir = path.join(process.cwd(), "__tests__/fixtures");
    const fullPath = path.join(baseDir, fileNameOrText);
    return fs.readFileSync(fullPath, "utf8");
  } else {
    return fileNameOrText;
  }
}
