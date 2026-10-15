import { expect, test, type Page } from "@playwright/test"
import { addTitle, captureIdea } from "../support/fixtures"
import { settled } from "../support/a11y"
import { longMotions, scrollsSideways } from "../support/motion"
import { createSpace, projectPage, signIn } from "../support/session"
import { createUser, requireStack } from "../support/stack"

requireStack()

// #20 acceptance: phone widths never scroll sideways, and reduced motion means no motion.
test.use({ reducedMotion: "reduce" })

let page: Page
const routes: Record<string, string> = {}

test.beforeAll(async ({ browser }) => {
  test.setTimeout(180_000)
  page = await projectPage(browser, { reducedMotion: "reduce" })
  await page.goto("./#/auth/sign-in")
  routes["sign in"] = "#/auth/sign-in"
  await signIn(page, await createUser("layout"))
  const space = await createSpace(page, "A rather long space name for a narrow phone")
  const item = await addTitle(page, space, "The Girl Who Leapt Through Time")
  const idea = await captureIdea(page, space, "A deliberately long idea title to stress wrapping")
  Object.assign(routes, {
    home: `#/s/${space}/home`,
    watch: `#/s/${space}/watch`,
    "watch item": `#/s/${space}/watch/${item}`,
    ideas: `#/s/${space}/ideas`,
    settings: `#/s/${space}/settings`,
    account: "#/account",
    "new space": "#/spaces/new",
  })
  for (const tab of ["overview", "research", "tasks", "milestones", "discussion"])
    routes[`idea ${tab}`] = `#/s/${space}/ideas/${idea}/${tab}`
})

test.afterAll(async () => page?.context().close())

test("no route scrolls sideways @mobile", async () => {
  test.slow()
  const wide: string[] = []
  for (const [name, path] of Object.entries(routes)) {
    await page.goto(`./${path}`)
    await settled(page)
    if (await scrollsSideways(page)) wide.push(name)
  }
  expect(wide).toEqual([])
})

test("reduced motion leaves nothing animating @mobile", async () => {
  test.slow()
  const moving: string[] = []
  for (const [name, path] of Object.entries(routes)) {
    await page.goto(`./${path}`)
    await settled(page)
    moving.push(...(await longMotions(page)).map((m) => `${name}: ${m}`))
  }
  await page.getByRole("button", { name: "Capture an idea from anywhere" }).click()
  await expect(page.getByRole("dialog")).toBeVisible()
  moving.push(...(await longMotions(page)).map((m) => `dialog: ${m}`))
  expect(moving).toEqual([])
})
