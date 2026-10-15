import { defineConfig, devices } from "@playwright/test"
import { localChromium } from "./tests/e2e/support/browser-path"

const executablePath = localChromium()
const chromium = devices["Desktop Chrome"]
// Flows run on desktop; tablet and phone run the layout and accessibility checks.
const RESPONSIVE = /@mobile|@a11y/
// E2E_PORT lets parallel worktrees avoid sharing (and stopping) one preview server. Auth email
// redirects are only allow-listed for 4173 in supabase/config.toml, so email flows need the default.
const PORT = Number(process.env.E2E_PORT ?? 4173)
const BASE_URL = `http://127.0.0.1:${PORT}`

export default defineConfig({
  testDir: "./tests/e2e",
  testMatch: "**/*.spec.ts",
  timeout: 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["list"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL: BASE_URL,
    trace: "retain-on-failure",
    launchOptions: executablePath ? { executablePath } : {},
  },
  projects: [
    { name: "desktop", use: { ...chromium, viewport: { width: 1280, height: 800 } } },
    {
      name: "tablet",
      use: { ...chromium, viewport: { width: 820, height: 1180 }, hasTouch: true },
      grep: RESPONSIVE,
    },
    {
      name: "mobile",
      use: { ...devices["Pixel 7"], viewport: { width: 360, height: 740 } },
      grep: RESPONSIVE,
    },
  ],
  // Builds with the current .env, then serves the production bundle the way Pages does.
  webServer: {
    command: `pnpm build && pnpm exec vite preview --host 127.0.0.1 --port ${PORT} --strictPort`,
    timeout: 300_000,
    url: BASE_URL,
    reuseExistingServer: !process.env.CI,
  },
})
