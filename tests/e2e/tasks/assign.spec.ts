import { expect, test } from "@playwright/test"
import { captureIdea, inviteMember, openIdeaTab, removeMember } from "../support/fixtures"
import { createSpace, signIn } from "../support/session"
import { createUser, requireStack } from "../support/stack"
import { addTask, setTaskField, taskCard } from "../support/tasks"
import { daysFromNow } from "../support/dates"

const due = daysFromNow(35)

requireStack()

// Ana works fourteen hours ahead of UTC; a date-only due date must still read the same day.
test.use({ timezoneId: "Pacific/Kiritimati" })

// #15 acceptance: assigning notifies the assignee, and leaving the space unassigns them.
test("assigning a task notifies the member and removal unassigns them", async ({
  page,
  browser,
}) => {
  test.setTimeout(240_000)
  const [ana, ben] = await Promise.all([createUser("ana"), createUser("ben")])
  await signIn(page, ana)
  const spaceId = await createSpace(page, "Assign test")
  const benPage = await inviteMember(page, browser, spaceId, ben)

  const ideaId = await captureIdea(page, spaceId, "Market day")
  await openIdeaTab(page, spaceId, ideaId, "tasks")
  await addTask(page, "Book the stall", due.iso)
  await setTaskField(page, "Book the stall", "Assignee", "ben")
  await expect(taskCard(page, "Book the stall")).toContainText(`Due ${due.shown}`)

  await benPage.reload()
  await benPage.getByRole("button", { name: "Notifications, 1 unread" }).click()
  await expect(benPage.getByRole("link", { name: /ana assigned you a task/ })).toBeVisible()
  await benPage.keyboard.press("Escape")

  await openIdeaTab(benPage, spaceId, ideaId, "tasks")
  const benCard = taskCard(benPage, "Book the stall")
  await expect(benCard).toContainText(`Due ${due.shown}`)
  await expect(benCard.getByLabel("Due")).toHaveValue(due.iso)
  await expect(benCard.getByLabel("Assignee").locator("option:checked")).toHaveText("ben")

  await removeMember(page, spaceId, "ben")
  await openIdeaTab(page, spaceId, ideaId, "tasks")
  const card = taskCard(page, "Book the stall")
  await expect(card.getByLabel("Assignee")).toHaveValue("")
  await expect(card.getByLabel("Assignee").locator("option:checked")).toHaveText("Unassigned")
  await benPage.context().close()
})
