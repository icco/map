import { defineConfig, devices } from "@playwright/test"

const port = process.env.PLAYWRIGHT_PORT || "18081"
const baseURL = `http://127.0.0.1:${port}`

export default defineConfig({
  testDir: "./e2e",
  snapshotPathTemplate: "{testDir}/screenshots/{arg}{ext}",
  forbidOnly: !!process.env.CI,
  reporter: process.env.CI ? "github" : "list",
  use: {
    ...devices["Desktop Chrome"],
    baseURL,
    reducedMotion: "reduce",
  },
  webServer: {
    command: "pnpm build && pnpm start",
    url: `${baseURL}/healthz`,
    reuseExistingServer: !process.env.CI,
    timeout: 240_000,
    env: { PORT: port, NEXT_TELEMETRY_DISABLED: "1" },
  },
})
