import { expect, test, type Page } from "@playwright/test"
import { axeViolations, expectAccessible, TOASTER } from "../support/a11y"
import { addTitle, captureIdea, inviteToken } from "../support/fixtures"
import { createSpace, projectPage, signIn } from "../support/session"
import { createUser, requireStack } from "../support/stack"

requireStack()

interface Fixture {
  space: string
  item: string
  idea: string
  token: string
}

const NOWHERE = "00000000-0000-4000-8000-000000000000"
const tab = (name: string) => (f: Fixture) => `#/s/${f.space}/ideas/${f.idea}/${name}`

// One member, one space, every signed-in route, including detail pages built from fixtures.
const ROUTES: Record<string, (f: Fixture) => string> = {
  home: (f) => `#/s/${f.space}/home`,
  watch: (f) => `#/s/${f.space}/watch`,
  "watch item": (f) => `#/s/${f.space}/watch/${f.item}`,
  ideas: (f) => `#/s/${f.space}/ideas`,
  "idea overview": tab("overview"),
  "idea research": tab("research"),
  "idea tasks": tab("tasks"),
  "idea milestones": tab("milestones"),
  "idea discussion": tab("discussion"),
  settings: (f) => `#/s/${f.space}/settings`,
  invite: (f) => `#/invite/${f.token}`,
  account: () => "#/account",
  "new space": () => "#/spaces/new",
  reset: () => "#/auth/reset",
  "new password": () => "#/auth/new-password",
  "not found": () => `#/s/${NOWHERE}/home`,
}

// Known defects owned outside this suite, keyed "<project>:<route>" or "*:<route>"; see
// routes.spec.ts for the rule. Remove an entry when its fix lands.
const KNOWN: Record<string, string> = {}

let page: Page
let fixture: Fixture

test.beforeAll(async ({ browser }) => {
  test.setTimeout(240_000)
  page = await projectPage(browser)
  await signIn(page, await createUser("axe"))
  const space = await createSpace(page, "Axe space")
  const item = await addTitle(page, space, "Axe title")
  const idea = await captureIdea(page, space, "Axe idea")
  fixture = { space, item, idea, token: await inviteToken(page, space) }
})

test.afterAll(async () => page?.context().close())

for (const [name, path] of Object.entries(ROUTES)) {
  test(`${name} has no axe violations and a valid heading outline @a11y`, async () => {
    test.slow()
    const known = KNOWN[`${test.info().project.name}:${name}`] ?? KNOWN[`*:${name}`]
    test.fail(known !== undefined, known)
    await page.goto(`./${path(fixture)}`)
    await expectAccessible(page)
  })
}

test("a success toast has enough contrast @a11y", async () => {
  // Adding a title no longer toasts (the add dialog lists it), so capture an idea instead.
  await page.goto(`./#/s/${fixture.space}/home`)
  await page.getByRole("button", { name: "Capture an idea from anywhere" }).click()
  await page.getByLabel("Idea", { exact: true }).fill("Toast idea")
  await page.getByRole("button", { name: "Save idea" }).click()
  await expect(page.getByText("Idea saved")).toBeVisible()
  await page.waitForFunction(() => document.getAnimations().length === 0)
  expect(await axeViolations(page, TOASTER)).toEqual([])
})
