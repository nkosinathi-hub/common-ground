import { expect, test, type Browser, type Locator, type Page } from "@playwright/test"
import { inviteToken } from "../support/fixtures"
import { realtimeJoined } from "../support/realtime"
import { createSpace, signIn } from "../support/session"
import { expectNotification } from "../support/social"
import { createUser, requireStack, type TestUser } from "../support/stack"

requireStack()

let spaceId = ""
let ana: Page
let ben: Page
let cy: Page

/** Joins through an invite, waiting until Home listens for arriving notes. */
async function join(browser: Browser, owner: Page, user: TestUser): Promise<Page> {
  // Leave settings first: a hash goto to the page already open would keep the last link on screen.
  await owner.goto(`./#/s/${spaceId}/home`)
  const token = await inviteToken(owner, spaceId)
  const page = await (await browser.newContext()).newPage()
  const listening = realtimeJoined(page, "note-arrivals-")
  await signIn(page, user)
  await page.goto(`./#/invite/${token}`)
  await page.getByRole("button", { name: "Accept and join" }).click()
  await page.waitForURL(new RegExp(`#/s/${spaceId}/home`))
  await listening
  return page
}

async function write(page: Page, to: string, body: string) {
  await page.getByRole("button", { name: "Write a note" }).click()
  const dialog = page.getByRole("dialog", { name: "Write a note" })
  await dialog.getByLabel("To", { exact: true }).selectOption({ label: to })
  await dialog.getByLabel("Note", { exact: true }).fill(body)
  await dialog.getByRole("button", { name: "Send" }).click()
  await expect(dialog).toBeHidden()
}

const note = (page: Page, body: string): Locator =>
  page.getByTestId("home-note").filter({ hasText: body })

test.beforeAll(async ({ browser }) => {
  test.setTimeout(240_000)
  const [owner, second, third] = await Promise.all(["ana", "ben", "cy"].map((h) => createUser(h)))
  ana = await (await browser.newContext()).newPage()
  const listening = realtimeJoined(ana, "note-arrivals-")
  await signIn(ana, owner!)
  spaceId = await createSpace(ana, "Notes test")
  await listening
  ben = await join(browser, ana, second!)
  cy = await join(browser, ana, third!)
  await ana.goto(`./#/s/${spaceId}/home`)
})

test.afterAll(async () => {
  for (const page of [ana, ben, cy]) await page?.context().close()
})

test("a note to one member is new for them, replies come back, and opening reads it", async () => {
  test.setTimeout(120_000)
  await write(ana, "ben", "Dinner at 7?")
  await expect(note(ana, "Dinner at 7?")).toContainText("You to ben")

  // Ben's Home reloads when the note arrives; it is highlighted with text, not colour alone.
  await expect(note(ben, "Dinner at 7?")).toContainText("ana to you")
  await expect(note(ben, "Dinner at 7?").getByText("New")).toBeVisible()
  await expectNotification(ben, /ana left you a note/)

  await note(ben, "Dinner at 7?").getByRole("button", { name: "Reply" }).click()
  await expect(note(ben, "Dinner at 7?").getByText("New")).toHaveCount(0)
  await note(ben, "Dinner at 7?").getByLabel("Your reply").fill("Yes, see you then")
  await note(ben, "Dinner at 7?").getByRole("button", { name: "Send reply" }).click()
  await expect(note(ben, "Dinner at 7?").getByText("Yes, see you then")).toBeVisible()

  // The reply makes the note new again for Ana; reading the thread clears it.
  await expectNotification(ana, /ben replied to a note/)
  await expect(note(ana, "Dinner at 7?").getByText("New")).toBeVisible()
  await note(ana, "Dinner at 7?").getByRole("button", { name: "Replies (1)" }).click()
  await expect(note(ana, "Dinner at 7?").getByText("Yes, see you then")).toBeVisible()
  await expect(note(ana, "Dinner at 7?").getByText("New")).toHaveCount(0)
  await ana.reload()
  await expect(note(ana, "Dinner at 7?")).toBeVisible()
  await expect(note(ana, "Dinner at 7?").getByText("New")).toHaveCount(0)
})

test("a note to everyone reaches every member, and a private one stays private", async () => {
  test.setTimeout(120_000)
  await write(ana, "Everyone", "Movie night on Friday")
  await expect(note(ben, "Movie night on Friday")).toContainText("ana to everyone")
  await expect(note(cy, "Movie night on Friday")).toContainText("ana to everyone")
  await expectNotification(cy, /ana left you a note/)
  await cy.reload()
  await expect(note(cy, "Movie night on Friday")).toBeVisible()
  await expect(note(cy, "Dinner at 7?")).toHaveCount(0)
})
