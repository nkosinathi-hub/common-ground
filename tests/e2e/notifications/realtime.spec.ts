import { expect, test } from "@playwright/test"
import { addTitle, captureIdea, inviteToken, openIdeaTab } from "../support/fixtures"
import { realtimeJoined } from "../support/realtime"
import { createSpace, signIn } from "../support/session"
import { recommend } from "../support/social"
import { createUser, requireStack } from "../support/stack"
import { addTask, setTaskField } from "../support/tasks"

requireStack()

// #18 acceptance: the unread badge follows new notifications live, without a reload.
test("the notification badge updates live in the other member's browser", async ({
  page,
  browser,
}) => {
  test.setTimeout(180_000)
  const [ana, ben] = await Promise.all([createUser("ana"), createUser("ben")])
  await signIn(page, ana)
  const spaceId = await createSpace(page, "Live test")
  const token = await inviteToken(page, spaceId)
  const benPage = await (await browser.newContext()).newPage()
  const joined = realtimeJoined(benPage, "notifications-")
  await signIn(benPage, ben)
  await benPage.goto(`./#/invite/${token}`)
  await benPage.getByRole("button", { name: "Accept and join" }).click()
  await benPage.waitForURL(new RegExp(`#/s/${spaceId}/home`))
  await joined
  const bell = benPage.getByRole("button", { name: /^Notifications/ })
  await expect(bell).toHaveAccessibleName("Notifications")

  await addTitle(page, spaceId, "Paprika")
  await recommend(page, "ben", "Dreams")
  await expect(bell).toHaveAccessibleName("Notifications, 1 unread")

  const ideaId = await captureIdea(page, spaceId, "Anime club")
  await openIdeaTab(page, spaceId, ideaId, "tasks")
  await addTask(page, "Book the room")
  await setTaskField(page, "Book the room", "Assignee", "ben")
  await expect(bell).toHaveAccessibleName("Notifications, 2 unread")

  await bell.click()
  await expect(benPage.getByRole("link", { name: /ana assigned you a task/ })).toBeVisible()
  await expect(benPage.getByRole("link", { name: /ana recommended something/ })).toBeVisible()
  await benPage.context().close()
})
