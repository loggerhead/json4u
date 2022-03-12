import { render } from "micromustache";

const messages = {
  zh: {
    title: "JSON对比, JSON忽略顺序比较差异, JSON Diff",
    description:
      "在线快速对比 JSON 差异，进行语义化、结构化比较。支持 64 位大整数 (bigint)、逐字符比较、大文件对比。同时支持 JSON 格式化、压缩、校验",
    compare: "比较",
    pretty: "格式化",
    minify: "最小化",
    escape: "转义",
    unescape: "去除转义",
    leftPlaceholder: "粘贴或拖拽文件到此处，自动格式化",
    rightPlaceholder: "粘贴或拖拽文件到此处，自动比较差异",
    syncScroll: "同步滚动",
    prev: "前一个",
    next: "后一个",
    nodiff: "两边没有差异",
    syntaxError: "第 {{line}} 行，第 {{column}} 列解析错误: '{{token}}'",
    unexpectedEndError: "第 {{line}} 行，第 {{column}} 列解析错误",
    unexpectedTypeError: "不支持的类型 '{{type}}'",
  },
  en: {
    title: "JSON Diff | JSON Compare",
    description:
      "Semantic compare two JSON. Support 64 bit number (use bigint), char-by-char compare. And also support JSON format, minify and validate.",
    compare: "Compare",
    pretty: "Format",
    escape: "Escape",
    unescape: "Unescape",
    minify: "Minify",
    leftPlaceholder: "Paste or drop your file here will auto format",
    rightPlaceholder: "Paste or drop your file here will auto compare",
    syncScroll: "Sync scroll",
    prev: "Previous",
    next: "Next",
    nodiff: "There is no difference between left and right",
    syntaxError: "Unexpected token '{{token}}' at line {{line}}, column {{column}}",
    unexpectedEndError: "Unexpected end of JSON input (line {{line}}, column {{column}})",
    unexpectedTypeError: "unexpected type '{{type}}'",
  },
};

let lang = "zh";

export function setupLang(l?: string) {
  lang = (l || lang).split("-")[0];
}

export function t(name: string, args?: any): string {
  const template = (messages as any)[lang][name];
  const s = args ? render(template, args) : template;
  return s ? s : `\$${name}`;
}
