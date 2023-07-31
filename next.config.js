/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // 除了 jest 使用 babel 编译以外，其它场景强制使用 SWC 编译：https://nextjs.org/docs/messages/swc-disabled
    forceSwcTransforms: true,
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

//
const withBundleAnalyzer = require("@next/bundle-analyzer")({
  enabled: process.env.ANALYZE === "true",
});

const path = require("path");
const MonacoWebpackPlugin = require("monaco-editor-webpack-plugin");
// https://juejin.cn/post/7091177467498463239#heading-4
const monacoConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  webpack: (config, { isServer, webpack, dev }) => {
    config.module.rules
      .filter((rule) => rule.oneOf)
      .forEach((rule) => {
        rule.oneOf.forEach((r) => {
          if (
            r.issuer &&
            r.issuer.and &&
            r.issuer.and.length === 1 &&
            r.issuer.and[0].source &&
            r.issuer.and[0].source.replace(/\\/g, "") === path.resolve(process.cwd(), "src/pages/_app")
          ) {
            r.issuer.or = [...r.issuer.and, /[\\/]node_modules[\\/]monaco-editor[\\/]/];
            delete r.issuer.and;
          }
        });
      });

    config.output.globalObject = "self";

    if (!isServer) {
      config.plugins.push(
        new MonacoWebpackPlugin({
          languages: ["json"],
          features: [
            "coreCommands",
            "bracketMatching",
            "browser",
            "caretOperations",
            "comment",
            "contextmenu",
            "cursorUndo",
            "dropOrPasteInto",
            "find",
            "folding",
            "gotoLine",
            "inPlaceReplace",
            "indentation",
            "lineSelection",
            "linesOperations",
            "linkedEditing",
            "links",
            "longLinesHelper",
            "multicursor",
            "quickCommand",
            "quickOutline",
            "smartSelect",
            "stickyScroll",
            "unusualLineTerminators",
            "wordHighlighter",
            "wordOperations",
            "wordPartOperations",
          ],
          filename: "static/[name].worker.js",
        })
      );
    }
    return config;
  },
};

module.exports = { ...withBundleAnalyzer(withMDX(nextConfig)), ...monacoConfig };
