import Papa from 'papaparse';
import {parseJSON} from "@/lib/parser";

/**
 * @typedef CsvOptions
 * @property {boolean} withCsvHeader 进行嵌套解析吗？
 */

/**
 * @param text csv 文本内容
 * @param options csv 转换配置
 * @returns {object, error} 转换结果
 */
export function csv2json(text, options = {}) {
  const {data, errors, meta} = Papa.parse(text, {
    header: options.withCsvHeader || false,
    skipEmptyLines: true,
    encoding: "UTF-8",
  });

  let error = "";

  if (errors.length > 0) {
    error = errors[0].code;
  } else if (text.trim().length === 0) {
    error = "EmptyInput";
  } else if (meta.aborted) {
    error = "ParseError";
  }

  return {
    object: data,
    error: code2errmsg(error),
  };
}

export function json2csv(text, options = {}) {
  const node = parseJSON(text, options);
  let obj;

  if (!node.hasError()) {
    obj = node.toCsvJSON();
  }

  if (node.hasError()) {
    return {
      text: "",
      errors: node.errors,
    };
  }

  text = Papa.unparse(obj, {
    skipEmptyLines: true,
  });

  return {
    text: text,
    errors: [],
  };
}

// 错误码转成错误信息
function code2errmsg(code) {
  const m = {
    "MissingQuotes": "缺失配对的引号",
    "UndetectableDelimiter": "未知分隔符",
    "TooFewFields": "字段数不一致，部分行少字段",
    "TooManyFields": "字段数不一致，部分行多字段",
    "ParseError": "解析失败",
    "EmptyInput": "输入为空",
  };

  return m[code];
}