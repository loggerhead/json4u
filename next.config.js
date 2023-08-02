const MonacoWebpackPlugin = require("monaco-editor-webpack-plugin");

/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // 除了 jest 使用 babel 编译以外，其它场景强制使用 SWC 编译：https://nextjs.org/docs/messages/swc-disabled
    forceSwcTransforms: true,
  },
  webpack: (config, { buildId, dev, isServer, defaultLoaders, nextRuntime, webpack }) => {
    if (!isServer) {
      config.plugins.push(
        new MonacoWebpackPlugin({
          languages: ["json"],
          features: [
            "quickOutline", // 折叠、查询等按钮的 css 样式
            "coreCommands", // 影响折叠按钮的展示
            "find", // 查找
            "folding", // 折叠
            "bracketMatching", // 高亮匹配的括号
            "contextmenu", // 右键菜单
            "indentation", // 缩进
            "quickCommand", // 命令面板
            "unusualLineTerminators", // invalid 换行符提示
            "wordHighlighter", // 高亮光标停留位置的词
          ],
          filename: "static/[name].worker.js",
        })
      );
    }

    return config;
  },
};

// 支持 posts 目录下 markdown 文件的编译
const withMDX = require("@next/mdx")({
  options: {
    remarkPlugins: [],
    rehypePlugins: [],
    // If you use `MDXProvider`, uncomment the following line.
    // providerImportSource: "@mdx-js/react",
  },
});

// 包大小分析
const withBundleAnalyzer = require("@next/bundle-analyzer")({
  enabled: process.env.ANALYZE === "true",
});

module.exports = withBundleAnalyzer(withMDX(nextConfig));
