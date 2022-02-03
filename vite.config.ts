import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import analyzer from "rollup-plugin-analyzer";
import importToCDN from "vite-plugin-cdn-import";
import ViteRadar from "vite-plugin-radar";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    analyzer({ summaryOnly: true }),
    ViteRadar({
      // Google Analytics tag injection
      analytics: {
        id: "G-TLYE3CBLPW",
      },
    }),
    importToCDN({
      modules: [
        {
          name: "codemirror",
          var: "CodeMirror",
          path: "https://cdn.jsdelivr.net/npm/codemirror@5.65.1/lib/codemirror.min.js",
          css: "https://cdn.jsdelivr.net/npm/codemirror@5.65.0/lib/codemirror.min.css",
        },
        {
          name: "vue",
          var: "Vue",
          path: "https://cdn.jsdelivr.net/npm/vue@3.2.29/dist/vue.runtime.global.prod.js",
        },
      ],
    }),
  ],
});
