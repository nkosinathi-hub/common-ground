import AxeBuilder from "@axe-core/playwright"
import { expect, type Page } from "@playwright/test"
import { headingLevels, headingProblems } from "./headings"

/** Sonner's live region; toasts from fixture setup linger, so they are scanned on their own. */
export const TOASTER = "[data-sonner-toaster]"

/** Axe violations as "<rule> at <targets>", scanning only `include` when given. */
export async function axeViolations(page: Page, include?: string): Promise<string[]> {
  const builder = new AxeBuilder({ page })
  const results = await (include ? builder.include(include) : builder.exclude(TOASTER)).analyze()
  return results.violations.map(
    (v) => `${v.id} at ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`,
  )
}

/**
 * Waits for a route's data to load: main is shown and no loading placeholder remains. Not
 * networkidle: the Realtime socket keeps the network busy.
 */
export async function settled(page: Page): Promise<void> {
  await expect(page.locator("main")).toBeVisible()
  await expect(page.getByRole("status").filter({ hasText: /^Loading/ })).toHaveCount(0)
}

/** Waits for a route to settle, then scans it with axe and checks its heading outline. */
export async function expectAccessible(page: Page): Promise<void> {
  await settled(page)
  await expect(page.getByRole("heading").first()).toBeVisible()
  // Contrast is only meaningful once transitions settle.
  await page.waitForFunction(() => document.getAnimations().length === 0)
  expect(await axeViolations(page)).toEqual([])
  expect(headingProblems(await headingLevels(page))).toEqual([])
}
