/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // 除了 jest 使用 babel 编译以外，其它场景强制使用 SWC 编译：https://nextjs.org/docs/messages/swc-disabled
    forceSwcTransforms: true,
  },
};

const withMDX = require("@next/mdx")({
  options: {
    remarkPlugins: [],
    rehypePlugins: [],
    // If you use `MDXProvider`, uncomment the following line.
    // providerImportSource: "@mdx-js/react",
  },
});

module.exports = withMDX(nextConfig);
