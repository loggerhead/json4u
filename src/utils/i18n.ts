import { render } from "micromustache";

const messages = {
  zh: {
    compare: "比较",
    pretty: "格式化",
    minify: "最小化",
    leftPlaceholder: "粘贴 JSON 自动格式化",
    rightPlaceholder: "粘贴 JSON 自动比较差异",
    syncScroll: "同步滚动",
    prev: "前一个",
    next: "后一个",
    nodiff: "两边没有差异",
    syntaxError: "第 {{line}} 行，第 {{column}} 列解析错误: '{{token}}'",
    unexpectedEndError: "第 {{line}} 行，第 {{column}} 列解析错误",
    unexpectedTypeError: "不支持的类型 '{{type}}'",
  },
  en: {
    compare: "Compare",
    pretty: "Pretty",
    minify: "Minify",
    leftPlaceholder: "Paste JSON here will auto pretty",
    rightPlaceholder: "Paste JSON here will auto compare",
    syncScroll: "Sync scroll",
    prev: "Previous",
    next: "Next",
    nodiff: "There is no difference between left and right",
    syntaxError: "Unexpected token '{{token}}' at line {{line}}, column {{column}}",
    unexpectedEndError: "Unexpected end of JSON input (line {{line}}, column {{column}})",
    unexpectedTypeError: "unexpected type '{{type}}'",
  },
};

const lang = (typeof window !== "undefined" && (navigator.language || (navigator as any).userLanguage)) || "en";

export function t(name: string, args?: any): string {
  let langKey = lang.split("-")[0];
  langKey = langKey in messages ? langKey : "en";

  const template = (messages as any)[langKey][name];
  const s = args ? render(template, args) : template;
  return s ? s : "";
}
