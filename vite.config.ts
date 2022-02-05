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
      modules: cdnModules(),
    }),
  ],
});

function cdnModules() {
  return [];
  return [
    {
      name: "codemirror",
      var: "CodeMirror",
      path: "https://cdn.jsdelivr.net/npm/codemirror@5.65.1/lib/codemirror.min.js",
      css: "https://cdn.jsdelivr.net/npm/codemirror@5.65.0/lib/codemirror.min.css",
    },
    {
      name: "codemirror/mode/javascript/javascript.js",
      var: "codemirror/mode/javascript/javascript.js",
      path: "https://cdn.jsdelivr.net/npm/codemirror@5.65.1/mode/javascript/javascript.js",
      css: "https://cdn.jsdelivr.net/npm/codemirror@5.65.1/theme/idea.css",
    },
    {
      name: "codemirror/addon/fold/foldgutter.js",
      var: "codemirror/addon/fold/foldgutter.js",
      path: "https://cdn.jsdelivr.net/npm/codemirror@5.65.1/addon/fold/foldgutter.js",
      css: "https://cdn.jsdelivr.net/npm/codemirror@5.65.1/addon/fold/foldgutter.css",
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
      css: "https://cdn.jsdelivr.net/npm/codemirror@5.65.1/addon/lint/lint.css",
    },
    {
      name: "codemirror/addon/lint/json-lint.js",
      var: "codemirror/addon/lint/json-lint.js",
      path: "https://cdn.jsdelivr.net/npm/codemirror@5.65.1/addon/lint/json-lint.js",
    },
    {
      name: "vue",
      var: "Vue",
      path: "https://cdn.jsdelivr.net/npm/vue@3.2.29/dist/vue.runtime.global.prod.js",
    },
  ];
}
