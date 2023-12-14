import {format} from '@/lib/format';
import {parseJSON} from "@/lib/parser";
import {escapeJSON, unescapeJSON} from "@/lib/escape";
import * as url from "@/lib/url";
import {smartCompare} from "@/lib/compare";

self.onmessage = async (event) => {
  const {isLeft, cmd, data} = event.data;

  const callback = (ret) => self.postMessage({
    isLeft: isLeft,
    cmd: cmd,
    data: ret,
  });

  switch (cmd) {
    case "format":
      callback(await format(data));
      return;
    case "minify":
      callback(await minify(data));
      return;
    case "escape":
      callback(escapeJSON(data));
      return;
    case "unescape":
      callback(unescapeJSON(data));
      return;
    case "sort": {
      const {text, options} = data;
      callback(await sort(text, options));
      return;
    }
    case "urlToJSON": {
      const {text, options} = data;
      callback(await urlToJsonString(text, options));
      return;
    }
    case "pythonDict2JSON": {
      const {text, options} = data;
      callback(await pythonDict2JSON(text, options));
      return;
    }
    case "compare": {
      const {ltext, rtext, needTextCompare} = data;
      callback(compare(ltext, rtext, needTextCompare));
      return;
    }
    case "handlePaste": {
      const {ltext, rtext, options} = data;
      callback(await handlePaste(isLeft, ltext, rtext, options));
      return;
    }
    default:
      console.error(`Unknown event: ${event}`);
  }
};

/**
 * @param {boolean} isLeft
 * @param {string} ltext
 * @param {string} rtext
 * @param {ParseOptions} options
 * @return {{text, errors, diffResult, needShowRightEditor}} 返回值
 */
async function handlePaste(isLeft, ltext, rtext, options) {
  const now = performance.now();
  const getText = () => isLeft ? ltext : rtext;

  const textSize = `${(getText().length / 1024).toFixed(2)}KB`;
  let ret = {
    text: getText(),
  };

  const setText = (text, errors = []) => {
    if (errors.length === 0) {
      if (isLeft) {
        ltext = text;
      } else {
        rtext = text;
      }

      ret.text = text;
    } else {
      ret.errors = errors;
    }
  };

  if (options.order) {
    const {text, errors} = await sort(getText(), options);
    setText(text, errors);
    // 自动排序时，已经进行过嵌套解析，因此不需要再解析
  } else if (options.nest) {
    const {text, errors} = await parse(getText(), options);
    setText(text, errors);
  }

  // 如果未进行过 format，或者已经进行过一次 format，则不需要再 format
  if (options.format && (ret.errors === undefined || ret.errors.length > 0)) {
    const text = await format(getText());
    setText(text);
  }

  // 如果是右侧编辑器粘贴文本
  if (!isLeft) {
    // 当左右两侧编辑器都不为空时，进行比较
    if (ltext.length > 0 && rtext.length > 0) {
      ret.diffResult = compare(ltext, rtext, options);
    }

    // 展开右侧编辑器
    ret.needShowRightEditor = true;
  }

  // 测量时间
  const cost = performance.now() - now;
  if (cost >= 100) {
    console.log(`handlePaste: ${textSize} cost ${Math.round(cost)}ms`);
  }

  return ret;
}

function compare(ltext, rtext, options = {}) {
  return smartCompare(ltext, rtext, options.needTextCompare);
}

// 最小化
async function minify(s) {
  let {text, errors} = await parse(s);

  if (errors.length > 0) {
    text = text.replace(/\s/g, "");
  }

  return {
    text: text,
    errors: errors,
  };
}

/** 对 JSON 字符串进行解析
 * @param {string} jsonStr
 * @param {ParseOptions} options
 * @return {{text, errors}} stringify 后的字符串以及解析错误
 */
async function parse(jsonStr, options = {}) {
  const node = parseJSON(jsonStr, options);
  let errors = [];
  let text = "";

  if (node.hasError()) {
    errors = node.errors;
  } else {
    text = node.stringify(options);

    if (options.format) {
      text = await format(text, {...options, forcePretty: true});
    }
  }

  return {
    text: text || jsonStr,
    errors: errors,
  };
}

/** 对 JSON 按 key 排序
 * @param {string} s
 * @param {ParseOptions} options
 * @return {{text, errors}} stringify 后的字符串以及解析错误
 */
async function sort(s, options = {}) {
  if (!options.order) {
    options = {
      ...options,
      order: "asc",
    };
  }

  return await parse(s, options);
}

// 将 python dict 转成 JSON
async function pythonDict2JSON(s, options) {
  s = s
    .replace(/,\s*\}(\W*?)/gm, "}$1")
    .replace(/,\s*\](\W*?)/gm, "]$1")
    .replace(/(\W*?)'/gm, `$1"`)
    .replace(/'(\W*?)/gm, `"$1`)
    .replace(/\bTrue\b/gm, "true")
    .replace(/\bFalse\b/gm, "false")
    .replace(/\bNone\b/gm, "null");
  return await format(s, options);
}

async function urlToJsonString(s, options) {
  let text = "";
  let error = null;

  try {
    const urlObj = url.urlToJsonString(s);
    text = await format(urlObj, options);
  } catch (e) {
    error = e;
  }

  return {
    text: text,
    error: error,
  };
}