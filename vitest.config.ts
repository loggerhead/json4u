import react from "@vitejs/plugin-react";
import AutoImport from "unplugin-auto-import/vite";
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
    includeSource: ["src/**/*.{js,ts,tsx}"],
  },
});
