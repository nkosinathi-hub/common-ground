import { expect, type Browser, type Page } from "@playwright/test"
import { secondMember } from "./session"
import type { TestUser } from "./stack"

const UUID = "[0-9a-f-]{36}"

/** Captures an idea from the ideas list, opens it and returns its id. */
export async function captureIdea(page: Page, spaceId: string, title: string): Promise<string> {
  await page.goto(`./#/s/${spaceId}/ideas`)
  await page.getByLabel("Idea title").fill(title)
  await page.getByRole("button", { name: "Capture", exact: true }).click()
  await page.getByRole("link", { name: title }).first().click()
  await page.waitForURL(new RegExp(`/ideas/${UUID}/overview`))
  return new RegExp(`/ideas/(${UUID})/`).exec(page.url())![1]!
}

/** Opens one tab of an idea and waits for its tab panel. */
export async function openIdeaTab(page: Page, spaceId: string, ideaId: string, tab: string) {
  await page.goto(`./#/s/${spaceId}/ideas/${ideaId}/${tab}`)
  await expect(page.getByRole("tabpanel", { name: tab })).toBeVisible()
}

/** Adds a watchlist title by hand, opens it and returns its id. */
export async function addTitle(page: Page, spaceId: string, title: string): Promise<string> {
  await page.goto(`./#/s/${spaceId}/watch`)
  // An empty list shows both the header button and the empty-state one.
  await page
    .getByRole("button", { name: /^(Add your first title|Add a title)$/ })
    .first()
    .click()
  await page.getByRole("button", { name: "Add a title manually" }).click()
  await page.getByLabel("Title", { exact: true }).fill(title)
  await page.getByRole("button", { name: "Add to your list" }).click()
  // The dialog stays open for the next title; it lists what was added until Done.
  const dialog = page.getByRole("dialog", { name: "Add a title" })
  await expect(dialog.getByRole("status")).toContainText(`Added: ${title}`)
  await dialog.getByRole("button", { name: "Done" }).click()
  await expect(dialog).toBeHidden()
  await page.getByRole("link", { name: title }).first().click()
  await page.waitForURL(new RegExp(`/watch/${UUID}`))
  return new RegExp(`/watch/(${UUID})`).exec(page.url())![1]!
}

/** Creates a single-use invite link in settings and returns its token. */
export async function inviteToken(page: Page, spaceId: string): Promise<string> {
  await page.goto(`./#/s/${spaceId}/settings`)
  await page.getByRole("button", { name: "Create invite link" }).click()
  const code = page.locator("code").last()
  await expect(code).toContainText("#/invite/")
  return (await code.textContent())!.trim().split("#/invite/")[1]!
}

/** Signs a user in on a fresh context and joins the space through a new invite. */
export async function inviteMember(
  owner: Page,
  browser: Browser,
  spaceId: string,
  user: TestUser,
): Promise<Page> {
  const token = await inviteToken(owner, spaceId)
  const page = await secondMember(browser, user)
  await page.goto(`./#/invite/${token}`)
  await page.getByRole("button", { name: "Accept and join" }).click()
  await page.waitForURL(new RegExp(`#/s/${spaceId}/home`))
  return page
}

/** The owner removes a member, by display name, from the settings page. */
export async function removeMember(owner: Page, spaceId: string, name: string) {
  await owner.goto(`./#/s/${spaceId}/settings`)
  await owner
    .getByRole("listitem")
    .filter({ has: owner.getByText(name, { exact: true }) })
    .getByRole("button", { name: "Remove", exact: true })
    .click()
  await owner.getByRole("alertdialog").getByRole("button", { name: "Remove" }).click()
  await expect(owner.getByText(`${name} was removed`)).toBeVisible()
}
