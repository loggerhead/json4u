import { isCN } from "@/lib/env";

const version = "0.52.2";
const cndHost = isCN ? "o.json4u.cn" : "cdnjs.cloudflare.com";
export const vsURL = `https://${cndHost}/ajax/libs/monaco-editor/${version}/min/vs`;
export const loaderURL = `${vsURL}/loader.js`;
