export const prettierURL = "https://cdn.json4u.com/prettier/3.1.1/standalone.js";
export const prettierPluginsURLs = [
  "https://cdn.json4u.com/prettier/3.1.1/plugins/babel.js",
  "https://cdn.json4u.com/prettier/3.1.1/plugins/estree.js",
];

function isInited(p = undefined, plugins = undefined) {
  if (p !== undefined && plugins !== plugins) {
    return true;
  }
  return (typeof prettier !== "undefined") && (typeof prettierPlugins !== "undefined");
}

function init() {
  if (typeof self !== "undefined") {
    importScripts(prettierURL);
    for (const plugin of prettierPluginsURLs) {
      importScripts(plugin);
    }
  }
}

/**
 * 格式化 JSON 字符串
 * @param {string} text - JSON 字符串
 * @param {function} fallback - prettier 加载失败、解析失败时，降级使用的 format 算法
 * @param {ParseOptions} options - 格式化参数
 * @returns {string} 格式化结果
 */
export async function format(text, fallback, options = {}) {
  if (!isInited()) {
    init();
  }

  try {
    const p = prettier || (typeof window !== "undefined" && window.prettier);
    const plugins = prettierPlugins || (typeof window !== "undefined" && window.prettierPlugins);
    text = await p.format(text, {
      parser: "json",
      plugins: plugins,
      tabWidth: 4,
      printWidth: options.printWidth || 120,
    });
  } catch {
    // 解析失败时，降级成尽力格式化
    console.log("prettier not inited, use fallback format.");
    text = fallback(text);
  }

  return text.trim();
}