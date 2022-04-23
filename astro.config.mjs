// @ts-check
import analyzer from "rollup-plugin-analyzer";

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
    plugins: [analyzer({ summaryOnly: true })],
  },
});
