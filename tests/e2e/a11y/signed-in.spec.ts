import AxeBuilder from "@axe-core/playwright"
import { expect, test, type Page } from "@playwright/test"
import { headingLevels, headingProblems } from "../support/headings"
import { createSpace, signIn } from "../support/session"
import { createUser, requireStack } from "../support/stack"

requireStack()

// One member, one space, every signed-in route. Feature detail pages join as they gain fixtures.
const ROUTES: Record<string, (spaceId: string) => string> = {
  home: (id) => `#/s/${id}/home`,
  watch: (id) => `#/s/${id}/watch`,
  ideas: (id) => `#/s/${id}/ideas`,
  settings: (id) => `#/s/${id}/settings`,
  account: () => "#/account",
  "new space": () => "#/spaces/new",
}

// Known defects owned outside this suite, keyed "<project>:<route>" or "*:<route>"; see
// routes.spec.ts for the rule. Remove an entry when its fix lands.
const RAIL = "color-contrast: active item in the nav rail (.bg-sidebar-accent), NavRail.svelte"
const KNOWN: Record<string, string> = {
  "desktop:home": RAIL,
  "desktop:watch": RAIL,
  "desktop:ideas": RAIL,
  "tablet:home": RAIL,
  "tablet:watch": RAIL,
  "tablet:ideas": RAIL,
  "desktop:new space": "color-contrast: .bg-primary text on the new space page",
  "*:account": "page-has-heading-one: AccountPage.svelte has no h1",
}

let page: Page
let spaceId = ""

test.beforeAll(async ({ browser }) => {
  test.setTimeout(180_000)
  page = await (await browser.newContext()).newPage()
  await signIn(page, await createUser("axe"))
  spaceId = await createSpace(page, "Axe space")
})

test.afterAll(async () => page?.context().close())

for (const [name, path] of Object.entries(ROUTES)) {
  test(`${name} has no axe violations and a valid heading outline @a11y`, async () => {
    test.slow()
    const known = KNOWN[`${test.info().project.name}:${name}`] ?? KNOWN[`*:${name}`]
    test.fail(known !== undefined, known)
    await page.goto(`./${path(spaceId)}`)
    await page.waitForLoadState("networkidle")
    await expect(page.locator("main")).toBeVisible()
    await expect(page.getByRole("heading").first()).toBeVisible()
    // Contrast is only meaningful once transitions settle.
    await page.waitForFunction(() => document.getAnimations().length === 0)
    const results = await new AxeBuilder({ page }).analyze()
    const found = results.violations.map(
      (v) => `${v.id} at ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`,
    )
    expect(found).toEqual([])
    expect(headingProblems(await headingLevels(page))).toEqual([])
  })
}
