const {withSentryConfig} = require("@sentry/nextjs");
const genRobotsFile = require("./robots");
const MonacoWebpackPlugin = require("monaco-editor-webpack-plugin");
const isVercel = process.env.NEXT_BUILD === "vercel";
const isProd = process.env.NODE_ENV === 'production';

genRobotsFile(isVercel);

/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // 除了 jest 使用 babel 编译以外，其它场景强制使用 SWC 编译：https://nextjs.org/docs/messages/swc-disabled
    forceSwcTransforms: true,
  },
  // 生成静态文件，方便托管在 CDN 上。https://nextjs.org/docs/pages/building-your-application/deploying/static-exports
  output: "export",
  reactStrictMode: false,
  trailingSlash: true,
  skipTrailingSlashRedirect: true,
  distDir: "dist",
  webpack: (config, {buildId, dev, isServer, defaultLoaders, nextRuntime, webpack}) => {
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
          filename: "static/[name].worker.bundle.js",
        }),
      );
    }

    config.module.rules.push({
      test: /\.svg$/,
      use: ['@svgr/webpack'],
    });
    return config;
  },
};

if (isVercel) {
  console.log("enable vercel build.");
  nextConfig.output = undefined;
  nextConfig.distDir = undefined;
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


// Injected content via Sentry wizard below

// https://github.com/getsentry/sentry-webpack-plugin#options
module.exports = withSentryConfig(
  module.exports,
  {
    org: "loggerhead",
    project: "json4u",
  },
  // https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/
  {
    ignore: [
      "cypress", "__tests__", "dist", "node_modules", "public", ".next",
      ".vercel", ".vscode", ".idea", ".gitignore", ".DS_Store", "runner-results",
      "*.log", ".env.*", "sentry.*.config.js", "README.md", "yarn.lock",
      "multi-reporter-config.json",
    ],
    // Upload a larger set of source maps for prettier stack traces (increases build time)
    widenClientFileUpload: true,
    // Transpiles SDK to be compatible with IE11 (increases bundle size)
    transpileClientSDK: false,
    // Hides source maps from generated client bundles
    hideSourceMaps: true,
    // Automatically tree-shake Sentry logger statements to reduce bundle size
    disableLogger: true,
    // Enables automatic instrumentation of Vercel Cron Monitors.
    // See the following for more information:
    // https://docs.sentry.io/product/crons/
    // https://vercel.com/docs/cron-jobs
    automaticVercelMonitors: true,
  },
);
