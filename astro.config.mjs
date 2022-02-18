// @ts-check
export default /** @type {import('astro').AstroUserConfig} */ ({
  buildOptions: {
    sitemap: true,
  },
  devOptions: {
    openBrowser: true,
  },
  renderers: ["@astrojs/renderer-vue"],
});
