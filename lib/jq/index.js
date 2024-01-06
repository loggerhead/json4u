import Aioli from "@biowasm/aioli";
import {format} from "../format";

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

  const now = performance.now();
  CLI = await new Aioli([{
    tool: "jq",
    version: version,
    urlPrefix: `https://cdn.json4u.com/jq/${version}`,
  }], {
    printInterleaved: false,
  });

  const cost = performance.now() - now;
  console.log(`加载 jq 成功：版本 ${version}，耗时 ${(cost / 1000).toFixed(2)}s`);
  return '';
}

export async function jq(text, filter) {
  const err = await init();
  if (err) {
    return ["", err];
  }

  const paths = await CLI.mount([{
    name: "text.txt",
    data: text,
  }]);

  const args = ["--monochrome-output", "--compact-output", filter].concat(paths);
  const {stdout, stderr} = await CLI.exec("jq", args);
  return [await format(stdout), stderr];
}

// 校验 jq 的 filter
export function isValidFilter(filter) {
  return true;
}
