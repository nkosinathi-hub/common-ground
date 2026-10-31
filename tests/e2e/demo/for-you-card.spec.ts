import { expect, test } from "@playwright/test"

test("For you picks keep a 2:3 poster and a long title inside the card", async ({ page }) => {
  await page.goto("/#/demo")
  const card = page.locator("[data-slot=card]", { hasText: "Recommended for you" })
  const row = card.getByRole("link", { name: /Arrival/ })
  await expect(row).toBeVisible()
  const poster = await row.locator("span").first().boundingBox()
  expect(poster && poster.height / poster.width).toBeCloseTo(1.5, 1)
  // A title too long for the aside truncates instead of pushing the row past the card.
  await row
    .locator(".truncate")
    .first()
    .evaluate((el) => {
      el.textContent = "The Fast and the Furious: Tokyo Drift, the extended cut"
    })
  const [cardBox, rowBox] = [await card.boundingBox(), await row.boundingBox()]
  expect(rowBox!.x + rowBox!.width).toBeLessThanOrEqual(cardBox!.x + cardBox!.width)
})
