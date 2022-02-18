import { defineConfig } from "vite";

export default defineConfig({
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
