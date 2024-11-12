import { defineConfig, devices } from "@playwright/test";
import dotenv from "dotenv";
import { fileURLToPath } from "node:url";
import path from "path";

const baseURL = "http://localhost:3000";
const CI = !!process.env.CI;
const __dirname = path.dirname(fileURLToPath(import.meta.url));

dotenv.config({ path: path.resolve(__dirname, ".env") });

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  timeout: 60 * 1000,
  expect: {
    /**
     * Maximum time expect() should wait for the condition to be met.
     * For example in `await expect(locator).toHaveText();`
     */
    timeout: 5 * 1000,
  },
  testDir: "./e2e/tests",
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: CI,
  retries: 1,
  workers: CI ? 2 : undefined,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: "html",
  use: {
    baseURL,
    trace: "retain-on-failure",
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "firefox",
      use: { ...devices["Desktop Firefox"] },
    },
    {
      name: "webkit",
      use: { ...devices["Desktop Safari"] },
    },
  ],
  /* Run your local server before starting the tests */
  webServer: {
    command: "pnpm preview",
    timeout: 10 * 60 * 1000,
    url: baseURL,
    reuseExistingServer: true,
  },
});
