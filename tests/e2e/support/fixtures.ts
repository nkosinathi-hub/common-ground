import { expect, type Browser, type Page } from "@playwright/test"
import { secondMember, zoneOf } from "./session"
import type { TestUser } from "./stack"

const UUID = "[0-9a-f-]{36}"

/** Captures an idea with the capture dialog on the ideas list, opens it and returns its id. */
export async function captureIdea(page: Page, spaceId: string, title: string): Promise<string> {
  await page.goto(`./#/s/${spaceId}/ideas`)
  await page.getByRole("button", { name: "Capture an idea from anywhere" }).click()
  await page.getByLabel("Idea", { exact: true }).fill(title)
  await page.getByRole("button", { name: "Save idea" }).click()
  await page.getByRole("link", { name: title }).first().click()
  await page.waitForURL(new RegExp(`/ideas/${UUID}/overview`))
  return new RegExp(`/ideas/(${UUID})/`).exec(page.url())![1]!
}

/** The region an idea section renders in, named after its link and the idea ("Tasks for Zine"). */
export const ideaSection = (page: Page, tab: string) =>
  page.getByRole("region", {
    name: new RegExp(`^${tab[0]!.toUpperCase()}${tab.slice(1)}( & budget)? for `),
  })

/** Opens one section of an idea and waits for its region. */
export async function openIdeaTab(page: Page, spaceId: string, ideaId: string, tab: string) {
  await page.goto(`./#/s/${spaceId}/ideas/${ideaId}/${tab}`)
  await expect(ideaSection(page, tab)).toBeVisible()
}

/** Adds a watchlist title by hand, opens it and returns its id. */
export async function addTitle(page: Page, spaceId: string, title: string): Promise<string> {
  await page.goto(`./#/s/${spaceId}/watch`)
  // An empty list shows both the header button and the empty-state one.
  await page
    .getByRole("button", { name: /^(Add your first title|Add a title)$/ })
    .first()
    .click()
  await page.getByRole("radio", { name: "Enter manually" }).click()
  await page.getByLabel("Title", { exact: true }).fill(title)
  await page.getByRole("button", { name: "Add title" }).click()
  // The dialog stays open for the next title; it lists what was added until Done.
  const dialog = page.getByRole("dialog", { name: "Add something good" })
  await expect(dialog.getByRole("status")).toContainText(`Added: ${title}`)
  await dialog.getByRole("button", { name: "Done" }).click()
  await expect(dialog).toBeHidden()
  await page.getByRole("link", { name: title }).first().click()
  await page.waitForURL(new RegExp(`/watch/${UUID}`))
  return new RegExp(`/watch/(${UUID})`).exec(page.url())![1]!
}

/** Creates a single-use invite link in settings and returns its token. */
export async function inviteToken(page: Page, spaceId: string): Promise<string> {
  await page.goto(`./#/s/${spaceId}/settings/members`)
  await page.getByRole("button", { name: "Create link" }).click()
  const code = page.locator("code").last()
  await expect(code).toContainText("#/invite/")
  return (await code.textContent())!.trim().split("#/invite/")[1]!
}

/**
 * Signs a user in on a fresh context in the owner's time zone and locale, and joins the space
 * through a new invite. `before` runs on the new page before it signs in.
 */
export async function inviteMember(
  owner: Page,
  browser: Browser,
  spaceId: string,
  user: TestUser,
  before?: (page: Page) => void,
): Promise<Page> {
  const token = await inviteToken(owner, spaceId)
  const page = await secondMember(browser, user, await zoneOf(owner), before)
  await page.goto(`./#/invite/${token}`)
  await page.getByRole("button", { name: "Accept and join" }).click()
  await page.waitForURL(new RegExp(`#/s/${spaceId}/home`))
  return page
}

/** The owner removes a member, by display name, from the settings page. */
export async function removeMember(owner: Page, spaceId: string, name: string) {
  await owner.goto(`./#/s/${spaceId}/settings/members`)
  await owner.getByRole("button", { name: `More for ${name}`, exact: true }).click()
  await owner.getByRole("menuitem", { name: "Remove" }).click()
  await owner.getByRole("alertdialog").getByRole("button", { name: "Remove" }).click()
  await expect(owner.getByText(`${name} was removed`)).toBeVisible()
}
