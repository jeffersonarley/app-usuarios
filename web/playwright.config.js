import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  // Un solo worker: las pruebas comparten la base de datos del seed.
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: "http://localhost:5173",
    testIdAttribute: "data-test",
    screenshot: "only-on-failure",
    trace: "on-first-retry",
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "firefox", use: { ...devices["Desktop Firefox"] } },
  ],
  webServer: [
    {
      // Base de datos aparte para E2E: nunca la de desarrollo.
      command: "npm run seed && npm run dev",
      cwd: "../api",
      port: 3000,
      reuseExistingServer: false,
      timeout: 120000,
      env: { MONGODB_CNX: "mongodb://127.0.0.1:27017/app-usuarios-e2e" },
    },
    {
      command: "npm run dev",
      port: 5173,
      reuseExistingServer: false,
      timeout: 120000,
    },
  ],
});
