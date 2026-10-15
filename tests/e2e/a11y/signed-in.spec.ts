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
const NO_IDEA_H1 =
  "idea pages have no h1: the title is only an input (src/features/ideas/ui/IdeaHeader.svelte:21)"
const KNOWN: Record<string, string> = {
  "*:watch item":
    "manual title's 'Where to watch' h3 follows the h1 (src/features/watch/ui/ItemAvailability.svelte:20)",
  ...Object.fromEntries(
    ["overview", "research", "tasks", "milestones", "discussion"].map((t) => [
      `*:idea ${t}`,
      NO_IDEA_H1,
    ]),
  ),
  "*:not found":
    "NotFound has no h1: its only heading is EmptyState's h2 (src/app/pages/NotFound.svelte:8, src/shared/ui/EmptyState.svelte:20)",
}

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
  test.fail(
    true,
    "richColors success toast is #008a2e on #ecfdf3, contrast 4.25 (src/app/App.svelte:53)",
  )
  await addTitle(page, fixture.space, "Toast title")
  await expect(page.getByText("Toast title is on your list")).toBeVisible()
  await page.waitForFunction(() => document.getAnimations().length === 0)
  expect(await axeViolations(page, TOASTER)).toEqual([])
})
