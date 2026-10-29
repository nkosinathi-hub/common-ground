import { expect, type Browser, type Locator, type Page } from "@playwright/test"
import { inviteToken } from "../support/fixtures"
import { realtimeJoined } from "../support/realtime"
import { projectPage, signIn } from "../support/session"
import { signedInClient } from "../support/clients"
import { createSpace } from "../support/session"
import { createUser, type TestUser } from "../support/stack"

/** Joins `spaceId` through an invite, waiting until Home listens for arriving notes. */
export async function join(
  browser: Browser,
  owner: Page,
  spaceId: string,
  user: TestUser,
): Promise<Page> {
  // Leave settings first: a hash goto to the page already open would keep the last link on screen.
  await owner.goto(`./#/s/${spaceId}/home`)
  const token = await inviteToken(owner, spaceId)
  const page = await projectPage(browser)
  const listening = realtimeJoined(page, "note-arrivals-")
  await signIn(page, user)
  await page.goto(`./#/invite/${token}`)
  await page.getByRole("button", { name: "Accept and join" }).click()
  await page.waitForURL(new RegExp(`#/s/${spaceId}/home`))
  await listening
  return page
}

/** Opens the composer as "Something on my mind" to `to`. */
export async function startSharing(page: Page, to: string): Promise<Locator> {
  await page.getByRole("button", { name: "Write a note" }).click()
  const dialog = page.getByRole("dialog", { name: "Write a note" })
  await dialog.getByRole("radio", { name: "Something on my mind" }).click()
  await dialog.getByLabel("To", { exact: true }).selectOption({ label: to })
  return dialog
}

/** The Home activity card. */
/** Recent activity: a Home card on wide screens, inside the folded group on phones. */
const feed = (page: Page): Locator =>
  page
    .locator('[data-slot="card"], section')
    .filter({ has: page.getByRole("heading", { name: /^Recently in/ }) })

/** The calm card at the top of Home for an unopened note. */
/** Opens the folded activity group on phones; wide screens show the feed as a card. */
async function showFeed(page: Page): Promise<Locator> {
  const fold = page.getByRole("button", { name: /Activity and recommendations/ })
  await expect(fold.or(feed(page)).first()).toBeVisible()
  if (await fold.isVisible()) await fold.click()
  return feed(page)
}

/** Reloads Home and checks the feed holds `shown` and none of `hidden`. */
export async function expectFeed(page: Page, shown: string[], hidden: string[] = []) {
  await page.reload()
  const list = await showFeed(page)
  for (const text of shown) await expect(list).toContainText(text)
  for (const text of hidden) await expect(list).not.toContainText(text)
}

export const waiting = (page: Page): Locator => page.getByTestId("shared-with-you")

export async function closeDialog(page: Page, dialog: Locator): Promise<void> {
  await page.keyboard.press("Escape")
  await expect(dialog).toBeHidden()
}

/** ana owns a new space; ben and cy join it. Pages are in that order, all on Home. */
export async function threeMembers(browser: Browser, name: string) {
  const users = await Promise.all(["ana", "ben", "cy"].map((h) => createUser(h)))
  const ana = await projectPage(browser)
  const listening = realtimeJoined(ana, "note-arrivals-")
  await signIn(ana, users[0]!)
  const spaceId = await createSpace(ana, name)
  await listening
  const ben = await join(browser, ana, spaceId, users[1]!)
  const cy = await join(browser, ana, spaceId, users[2]!)
  await ana.goto(`./#/s/${spaceId}/home`)
  return { spaceId, users, pages: [ana, ben, cy] as const }
}

/** Rows the user can read straight from the REST API, past the app. */
export async function readable(user: TestUser, table: string): Promise<unknown[]> {
  const { data, error } = await (await signedInClient(user)).from(table).select("*")
  if (error) throw new Error(`${table}: ${error.message}`)
  const rows: unknown[] = data ?? []
  return rows
}
