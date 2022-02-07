import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import analyzer from "rollup-plugin-analyzer";
import importToCDN from "vite-plugin-cdn-import";
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
    importToCDN({
      modules: [
        {
          name: "codemirror",
          var: "CodeMirror",
          path: "https://cdn.jsdelivr.net/npm/codemirror@5.65.1/lib/codemirror.min.js",
        },
        {
          name: "codemirror/mode/javascript/javascript.js",
          var: "codemirror/mode/javascript/javascript.js",
          path: "https://cdn.jsdelivr.net/npm/codemirror@5.65.1/mode/javascript/javascript.js",
        },
        {
          name: "codemirror/addon/fold/foldgutter.js",
          var: "codemirror/addon/fold/foldgutter.js",
          path: "https://cdn.jsdelivr.net/npm/codemirror@5.65.1/addon/fold/foldgutter.js",
        },
        {
          name: "codemirror/addon/fold/foldcode.js",
          var: "codemirror/addon/fold/foldcode.js",
          path: "https://cdn.jsdelivr.net/npm/codemirror@5.65.1/addon/fold/foldcode.js",
        },
        {
          name: "codemirror/addon/display/placeholder.js",
          var: "codemirror/addon/display/placeholder.js",
          path: "https://cdn.jsdelivr.net/npm/codemirror@5.65.1/addon/display/placeholder.js",
        },
        {
          name: "codemirror/addon/fold/brace-fold.js",
          var: "codemirror/addon/fold/brace-fold.js",
          path: "https://cdn.jsdelivr.net/npm/codemirror@5.65.1/addon/fold/brace-fold.js",
        },
        {
          name: "codemirror/addon/lint/lint.js",
          var: "codemirror/addon/lint/lint.js",
          path: "https://cdn.jsdelivr.net/npm/codemirror@5.65.1/addon/lint/lint.js",
        },
        {
          name: "codemirror/addon/lint/json-lint.js",
          var: "codemirror/addon/lint/json-lint.js",
          path: "https://cdn.jsdelivr.net/npm/codemirror@5.65.1/addon/lint/json-lint.js",
        },
      ],
    }),
  ],
  ssgOptions: {
    script: "async",
    formatting: "minify",
  },
});
