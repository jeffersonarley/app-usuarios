import { fileURLToPath, URL } from "node:url";
import vue from "@vitejs/plugin-vue";
import { defineConfig } from "vitest/config";

// Reutiliza la configuración de Vite (plugin de Vue y alias @) y añade jsdom.
export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  test: {
    environment: "jsdom",
    setupFiles: ["tests/setup.js"],
    include: ["tests/**/*.test.js"],
    exclude: ["e2e/**", "node_modules/**"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html", "json-summary"],
      include: ["src/**/*.{js,vue}"],
      exclude: ["src/main.js"],
      thresholds: { lines: 80, functions: 80, statements: 80, branches: 70 },
    },
  },
});
