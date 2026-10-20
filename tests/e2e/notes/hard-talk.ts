import { expect, type Browser, type Locator, type Page } from "@playwright/test"
import { inviteToken } from "../support/fixtures"
import { realtimeJoined } from "../support/realtime"
import { projectPage, signIn } from "../support/session"
import { signedInClient } from "../support/clients"
import { createSpace } from "../support/session"
import { createUser, type TestUser } from "../support/stack"

/** Joins `spaceId` through an invite, waiting until Home listens for arriving notes. */
async function join(browser: Browser, owner: Page, spaceId: string, user: TestUser): Promise<Page> {
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
export const feed = (page: Page): Locator =>
  page
    .locator('[data-slot="card"]')
    .filter({ has: page.getByRole("heading", { name: /^Recently in/ }) })

/** The calm card at the top of Home for an unopened note. */
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
