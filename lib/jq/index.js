import Aioli from "@biowasm/aioli";
import {format} from "@/lib/format";

// https://biowasm.com/cdn/v3/jq/1.7
export const version = "1.7";
let CLI;

/** 加载 jq
 * @returns {Promise<string>} 失败信息
 */
export async function init() {
  if (CLI) {
    return '';
  }

  CLI = await new Aioli([{
    tool: "jq",
    version: version,
    urlPrefix: "http://cdn.json4u.com/jq/1.7",
  }], {
    printInterleaved: false,
  });

  console.log("加载 jq 成功");
  return '';
}

export async function jq(text, filter) {
  const err = await init();
  if (err) {
    return ["", err];
  }

  CLI.stdin = text;
  const {stdout, stderr} = await CLI.exec("jq", ["--monochrome-output", "--compact-output", filter]);
  let res = "";

  if (stdout) {
    res = format(stdout);
  }

  return [res, stderr];
}

// 校验 jq 的 filter
export function isValidFilter(filter) {
  return true;
}
