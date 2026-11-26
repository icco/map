import { expect, test } from "@playwright/test"

const viewports = {
  desktop: { width: 1440, height: 900, deviceScaleFactor: 1 },
  mobile: { width: 390, height: 844, deviceScaleFactor: 2 },
}

for (const [device, { deviceScaleFactor, ...viewport }] of Object.entries(
  viewports
)) {
  for (const theme of ["light", "dark"] as const) {
    test.describe(`${device} ${theme}`, () => {
      test.use({ viewport, deviceScaleFactor, colorScheme: theme })

      test("map", async ({ context, page, baseURL }) => {
        await context.addCookies([
          { name: "theme", value: theme, url: baseURL },
        ])
        await page.goto("/", { waitUntil: "networkidle" })
        await expect(page.locator("html")).toHaveAttribute("data-theme", theme)
        await expect(page.locator("[data-place]").first()).toBeVisible()
        await expect(page).toHaveScreenshot(`map-${device}-${theme}.png`, {
          animations: "disabled",
          mask: [page.locator("header a svg")],
        })
      })
    })
  }
}
