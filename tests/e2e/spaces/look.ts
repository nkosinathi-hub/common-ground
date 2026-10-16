import { expect, type Page } from "@playwright/test"
import { contrastRatio } from "../../../src/features/spaces/domain/contrast"

/** A 2x1 PNG: enough for the canvas to crop and re-encode. */
export const PICTURE = {
  name: "us.png",
  mimeType: "image/png",
  buffer: Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAIAAAABCAYAAAD0In+KAAAAEUlEQVR4nGPQz2r4f6pl7n8AE08FA0gduiUAAAAASUVORK5CYII=",
    "base64",
  ),
}

/** A root CSS variable as the browser resolved it, as #rrggbb. */
export async function rootColour(page: Page, name: string): Promise<string> {
  return page.evaluate((variable) => {
    const raw = getComputedStyle(document.documentElement).getPropertyValue(variable).trim()
    const probe = document.createElement("canvas").getContext("2d")!
    probe.fillStyle = raw
    return probe.fillStyle
  }, name)
}

/** --primary reads as text on --background at 4.5:1 or better. */
export async function expectReadablePrimary(page: Page) {
  const [primary, background] = [
    await rootColour(page, "--primary"),
    await rootColour(page, "--background"),
  ]
  expect(contrastRatio(primary, background)).toBeGreaterThanOrEqual(4.5)
  return primary
}

/** Saves one settings form and waits for the confirmation. */
export async function saveSettings(page: Page, button: string) {
  await page.getByRole("button", { name: button, exact: true }).click()
  await expect(page.getByText("Saved").last()).toBeVisible()
}
