import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    setupFiles: ["tests/setup.js"],
    testTimeout: 30000,
    hookTimeout: 180000,
    // La API de pruebas no usa la base real ni el .env: MongoDB en memoria y
    // un secreto JWT fijo definido aquí.
    env: {
      JWT_SECRET: "secreto-de-pruebas-suficientemente-largo",
      JWT_EXPIRA: "4h",
    },
    coverage: {
      provider: "v8",
      reporter: ["text", "html", "json-summary"],
      include: ["app.js", "controllers/**", "middlewares/**", "helpers/**", "models/**", "routes/**"],
      thresholds: { lines: 80, functions: 80, statements: 80, branches: 70 },
    },
  },
});
