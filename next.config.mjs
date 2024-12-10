import NextBundleAnalyzer from "@next/bundle-analyzer";
import createMDX from "@next/mdx";
import { withSentryConfig } from "@sentry/nextjs";
import createJiti from "jiti";
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
  webpack(config, { dev, isServer, webpack }) {
    if (!isServer) {
      config.resolve.fallback = { fs: false };
      config.resolve.alias = {
        ...config.resolve.alias,
        "@": __dirname,
      };
      config.output.webassemblyModuleFilename = "static/wasm/[modulehash].wasm";
      // can't use experiments
      // config.experiments = { asyncWebAssembly: true };

      config.plugins.push(
        new webpack.DefinePlugin({
          __SENTRY_DEBUG__: false,
          __SENTRY_TRACING__: false,
          __RRWEB_EXCLUDE_IFRAME__: true,
          __RRWEB_EXCLUDE_SHADOW_DOM__: true,
          __SENTRY_EXCLUDE_REPLAY_WORKER__: true,
        }),
      );
    }

    return config;
  },
};

const withNextIntl = createNextIntlPlugin("./src/i18n/request.tsx");
const withMDX = createMDX({});
const withBundleAnalyzer = NextBundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
});

const config = withBundleAnalyzer(withNextIntl(withMDX(nextConfig)));

const enableSourceMap = !!process.env.SENTRY_AUTH_TOKEN;

export default withSentryConfig(config, {
  // For all available options, see:
  // https://github.com/getsentry/sentry-webpack-plugin#options
  org: "loggerhead",
  project: "json4u",
  enable: !isDev,
  authToken: enableSourceMap ? process.env.SENTRY_AUTH_TOKEN : undefined,
  // avoid build failed when miss SENTRY_AUTH_TOKEN
  sourcemaps: {
    disable: !enableSourceMap,
  },
  // Only print logs for uploading source maps in CI
  silent: !process.env.CI,

  // For all available options, see:
  // https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/
  ignore: [
    "__tests__",
    "e2e",
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
