import { expect, test, type Page } from "@playwright/test"
import { captureIdea, inviteMember, openIdeaTab } from "../support/fixtures"
import { createSpace, projectPage, signIn } from "../support/session"
import { comment, expectNotification } from "../support/social"
import { createUser, requireStack } from "../support/stack"

requireStack()

let ana: Page
let ben: Page

test.afterAll(async () => {
  await ben?.context().close()
  await ana?.context().close()
})

test("an accepted invite makes it our idea, and the new collaborator follows it", async ({
  browser,
}) => {
  test.setTimeout(240_000)
  const [owner, member] = await Promise.all([createUser("ana"), createUser("ben")])
  ana = await projectPage(browser)
  await signIn(ana, owner)
  const spaceId = await createSpace(ana, "Collaborators test")
  ben = await inviteMember(ana, browser, spaceId, member)
  const ideaId = await captureIdea(ana, spaceId, "Garden club")
  await expect(ana.getByText("Started by ana")).toBeVisible()

  await ana.getByRole("button", { name: "People" }).click()
  const dialog = ana.getByRole("dialog", { name: "People on this idea" })
  await expect(dialog.getByRole("checkbox", { name: "ana (started it)" })).toBeDisabled()
  await dialog.getByRole("checkbox", { name: "ben" }).check()
  await dialog.getByRole("button", { name: "Save" }).click()
  await expect(dialog).toBeHidden()

  // Ben is told, opens the idea from the notification and accepts.
  await ben.reload()
  await ben.getByRole("button", { name: /^Notifications, \d+ unread$/ }).click()
  await ben.getByRole("link", { name: /ana invited you to an idea/ }).click()
  const invitation = ben.getByRole("region", { name: "Invitation" })
  await expect(invitation).toContainText("ana invited you to work on this idea")
  await invitation.getByRole("button", { name: "Accept" }).click()
  await expect(invitation).toBeHidden()
  await expect(ben.getByText("Our idea")).toBeVisible()
  await expect(ben.getByRole("img", { name: "On this idea: ana, ben" })).toBeVisible()
  await expectNotification(ana, /ben joined your idea/)

  // Ours is server-filtered: the idea is Ben's too, but not his own.
  await ben.goto(`./#/s/${spaceId}/ideas`)
  const whose = ben.getByRole("combobox", { name: "Whose" })
  await whose.selectOption({ label: "Ours" })
  const card = ben.getByTestId("idea-card").filter({ hasText: "Garden club" })
  await expect(card.getByText("Our idea")).toBeVisible()
  await whose.selectOption({ label: "Mine" })
  await expect(ben.getByText("No ideas match these filters.")).toBeVisible()

  // A comment by Ana reaches Ben as a follower of the idea.
  await openIdeaTab(ana, spaceId, ideaId, "discussion")
  await comment(ana, "First seeds arrive Monday")
  await ben.reload()
  await expectNotification(ben, /ana commented on your idea/)
})
