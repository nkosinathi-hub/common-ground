import AxeBuilder from "@axe-core/playwright"
import { expect, test } from "@playwright/test"
import { headingLevels, headingProblems } from "../support/headings"

// Public routes need no local stack. Signed-in routes join this list as their features land.
const PUBLIC_ROUTES = [
  { path: "#/auth/sign-in", heading: "Welcome back" },
  { path: "#/auth/sign-up", heading: "Create your account" },
  { path: "#/privacy", heading: "Privacy" },
]

// Known defects, owned outside this suite. test.fail flips to a failure once the fix lands, so
// the entry must then be removed. Never add an entry to silence a new violation.
const KNOWN: Record<string, string> = {}

for (const route of PUBLIC_ROUTES) {
  test(`${route.path} has no axe violations @a11y`, async ({ page }) => {
    test.slow()
    const known = KNOWN[route.path]
    test.fail(known !== undefined, known)
    await page.goto(`./${route.path}`)
    await expect(page.getByRole("heading", { level: 1, name: route.heading })).toBeVisible()
    const results = await new AxeBuilder({ page }).analyze()
    const summary = results.violations.map((v) => `${v.id}: ${v.help} (${v.nodes.length})`)
    expect(summary).toEqual([])
  })

  // Regression for card titles rendering as real headings: one h1, no skipped levels.
  test(`${route.path} has a valid heading outline @a11y`, async ({ page }) => {
    test.slow()
    await page.goto(`./${route.path}`)
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible()
    expect(headingProblems(await headingLevels(page))).toEqual([])
  })
}
