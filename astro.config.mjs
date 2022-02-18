// @ts-check
export default /** @type {import('astro').AstroUserConfig} */ ({
  buildOptions: {
    site: "https://json4u.com",
  },
  devOptions: {
    openBrowser: true,
  },
  renderers: ["@astrojs/renderer-vue"],
});
