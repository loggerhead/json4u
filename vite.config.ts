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
  build: {
    rollupOptions: {
      output: {
        inlineDynamicImports: false,
        manualChunks: {
          // 打包成一个 codemirror.js
          codemirror: [
            "codemirror",
            "codemirror/mode/javascript/javascript",
            "codemirror/addon/lint/json-lint",
            "codemirror/addon/display/placeholder",
            "codemirror/addon/fold/foldgutter",
            "codemirror/addon/fold/foldcode",
            "codemirror/addon/fold/brace-fold",
            "codemirror/addon/lint/lint",
          ],
        },
      },
    },
  },
});
