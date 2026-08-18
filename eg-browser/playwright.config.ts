import { defineConfig, devices } from "@playwright/test";

/**
 * The app is served under a base path, so every navigation must go through
 * `/browser/`. Keeping it in baseURL means specs can use relative paths.
 */
const PORT = Number(process.env.EG_E2E_PORT ?? 5173);
const BASE_URL = process.env.EG_E2E_BASE_URL ?? `http://localhost:${PORT}/browser/`;

export default defineConfig({
  testDir: "./e2e",
  // Track data comes over the network; even replayed from a HAR the first paint
  // of a heavy track is not instant.
  timeout: 90_000,
  expect: { timeout: 15_000 },
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  // Track rendering is CPU-heavy. With the default worker count the browsers
  // starve each other, the container falls behind, and toolbar clicks land
  // mid-rebuild and get dropped — which reads as a flaky test rather than the
  // resource problem it is. Two workers is the stable ceiling in practice.
  workers: 2,
  reporter: process.env.CI
    ? [["github"], ["html", { open: "never" }]]
    : [["list"], ["html", { open: "never" }]],

  use: {
    baseURL: BASE_URL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
    // Canvas-heavy rendering is viewport-sensitive; pin it so screenshots and
    // "how many bases fit on screen" stay comparable between runs.
    viewport: { width: 1600, height: 1000 },
  },

  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],

  webServer: {
    // Dev mode already enables the test handle; VITE_EG_TEST is set anyway so
    // the same command works against a preview build.
    command: `npm run dev -- --port ${PORT} --strictPort`,
    url: BASE_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    env: { VITE_EG_TEST: "1" },
  },
});
