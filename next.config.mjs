import NextBundleAnalyzer from "@next/bundle-analyzer";
import createMDX from "@next/mdx";
import { withSentryConfig } from "@sentry/nextjs";
import withSerwistInit from "@serwist/next";
import createJiti from "jiti";
import MonacoWebpackPlugin from "monaco-editor-webpack-plugin";
import createNextIntlPlugin from "next-intl/plugin";
import { fileURLToPath } from "node:url";
import path from "path";

// TODO: After the stable version of Million Lint is released, consider using it to further enhance performance.
// Currently, there are bugs in it that can cause the popover component not work.

// validate environment variables during build
const jiti = createJiti(fileURLToPath(import.meta.url));
jiti("./src/lib/env");

const isDev = process.env.NODE_ENV === "development";
const isCN = /\.cn(:3000)?$/.test(process.env.NEXT_PUBLIC_APP_URL);
const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {import("next").NextConfig} */
const nextConfig = {
  // not affect auto batching, but it may cause console.log output three times: https://github.com/facebook/react/issues/24570
  reactStrictMode: true,
  swcMinify: true,
  poweredByHeader: false,
  output: isCN ? "standalone" : undefined,
  pageExtensions: ["js", "jsx", "md", "mdx", "ts", "tsx"],
  experimental: {
    serverActions: {
      allowedOrigins: ["json4u.com", "*.json4u.com", "json4u.cn", "*.json4u.cn"],
    },
    optimizePackageImports: [
      "react-use",
      "@next/mdx",
      "lodash-es",
      "lucide-react",
      "monaco-editor",
      "@xyflow/react",
      "@supabase/auth-ui-react",
      "@supabase/auth-ui-shared",
      "@supabase/supabase-js",
      "@sentry/react",
      "@sentry/nextjs",
      "@sentry/utils",
      "zod",
      "usehooks-ts",
    ],
  },
  webpack(config, { dev, isServer }) {
    if (!isServer) {
      config.resolve.fallback = { fs: false };
      config.resolve.alias = {
        ...config.resolve.alias,
        "@": __dirname,
      };
      config.output.webassemblyModuleFilename = "static/wasm/[modulehash].wasm";

      config.plugins.push(
        new MonacoWebpackPlugin({
          languages: ["json"],
          features: [
            "find", // 查找
            "folding", // 折叠
            "bracketMatching", // 高亮匹配的括号
            "indentation", // 缩进
            "unusualLineTerminators", // invalid 换行符提示
            "wordHighlighter", // 高亮光标停留位置的词
            "stickyScroll", // https://learn.microsoft.com/en-us/visualstudio/ide/editor-sticky-scroll
          ],
          filename: "static/[name].[contenthash:8].worker.js",
        }),
      );

      // can't use experiments
      // config.experiments = { asyncWebAssembly: true };
    }

    return config;
  },
};

const withSerwist = withSerwistInit({
  swSrc: "src/app/sw.ts",
  swDest: "public/sw.js",
  maximumFileSizeToCacheInBytes: 10 * 1024 * 1024,
  additionalPrecacheEntries: ["jq/1.7/jq.js", "jq/1.7/jq.wasm"],
});
const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");
const withMDX = createMDX({});
const withBundleAnalyzer = NextBundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
});

const config = withBundleAnalyzer(withSerwist(withNextIntl(withMDX(nextConfig))));

export default withSentryConfig(config, {
  // For all available options, see:
  // https://github.com/getsentry/sentry-webpack-plugin#options
  org: "loggerhead",
  project: "json4u",
  enable: !isDev,

  // Only print logs for uploading source maps in CI
  silent: !process.env.CI,

  // For all available options, see:
  // https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/
  ignore: [
    "cypress",
    "__tests__",
    "dist",
    "node_modules",
    "public",
    ".next",
    ".vercel",
    ".vscode",
    ".idea",
    ".gitignore",
    ".DS_Store",
    "*.log",
    ".env.*",
    "sentry.*.config.js",
    "README.md",
    "yarn.lock",
  ],
  // Upload a larger set of source maps for prettier stack traces (increases build time)
  widenClientFileUpload: true,
  // Transpiles SDK to be compatible with IE11 (increases bundle size)
  transpileClientSDK: false,
  telemetry: false,
  // Automatically tree-shake Sentry logger statements to reduce bundle size
  disableLogger: true,
});
