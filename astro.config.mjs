// @ts-check
export default /** @type {import('astro').AstroUserConfig} */ ({
  buildOptions: {
    site: "https://json4u.com",
    sitemap: true,
  },
  devOptions: {
    openBrowser: true,
  },
  renderers: ["@astrojs/renderer-vue"],
  vite: {
    plugins: [],
  },
});
