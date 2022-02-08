import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import analyzer from "rollup-plugin-analyzer";
import ViteRadar from "vite-plugin-radar";

export default defineConfig({
  plugins: [
    vue(),
    // analyzer({ summaryOnly: true }),
    ViteRadar({
      analytics: {
        id: "G-TLYE3CBLPW",
      },
    }),
  ],
  ssgOptions: {
    script: "async",
    formatting: "minify",
  },
});
