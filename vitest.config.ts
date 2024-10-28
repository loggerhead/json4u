import react from "@vitejs/plugin-react";
import AutoImport from "unplugin-auto-import/vite";
import { loadEnv } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [
    tsconfigPaths(),
    react(),
    AutoImport({
      imports: ["vitest"],
      dts: true, // generate TypeScript declaration
    }),
  ],
  test: {
    environment: "happy-dom",
    include: ["__tests__/*.{test,spec}.?(c|m)[jt]s?(x)"],
    includeSource: ["src/**/*.{js,ts,tsx}"],
    // https://github.com/vitest-dev/vitest/issues/2117
    env: loadEnv("", process.cwd(), ""),
  },
});
