const MonacoWebpackPlugin = require("monaco-editor-webpack-plugin");

/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // 除了 jest 使用 babel 编译以外，其它场景强制使用 SWC 编译：https://nextjs.org/docs/messages/swc-disabled
    forceSwcTransforms: true,
  },
  // 生成静态文件，方便托管在 CDN 上。https://nextjs.org/docs/pages/building-your-application/deploying/static-exports
  output: "export",
  trailingSlash: true,
  skipTrailingSlashRedirect: true,
  distDir: "dist",
  webpack: (config, { buildId, dev, isServer, defaultLoaders, nextRuntime, webpack }) => {
    if (!isServer) {
      config.plugins.push(
        new MonacoWebpackPlugin({
          languages: ["json"],
          features: [
            "find", // 查找
            "folding", // 折叠
            "bracketMatching", // 高亮匹配的括号
            "contextmenu", // 右键菜单
            "indentation", // 缩进
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

if (process.env.NEXT_BUILD === "vercel") {
  nextConfig.output = undefined;
}

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
