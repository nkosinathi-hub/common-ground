import { expect, test, type Page } from "@playwright/test"
import { daysFromNow } from "../support/dates"
import { captureIdea, openIdeaTab } from "../support/fixtures"
import { createSpace, signIn } from "../support/session"
import { createUser, requireStack } from "../support/stack"
import { addTask } from "../support/tasks"

requireStack()

// Fourteen hours ahead of UTC: date-only due dates must still land on their own day.
test.use({ timezoneId: "Pacific/Kiritimati" })

const due = daysFromNow(4)
const target = daysFromNow(6)

// #29 acceptance: a task due date and a milestone show on the calendar and open their idea.
test("task due dates and milestones are on the calendar and link to the idea", async ({ page }) => {
  test.setTimeout(180_000)
  await signIn(page, await createUser("ana"))
  const spaceId = await createSpace(page, "Due dates test")
  const ideaId = await captureIdea(page, spaceId, "Garden")
  await openIdeaTab(page, spaceId, ideaId, "tasks")
  await addTask(page, "Buy seeds", due.iso)
  await openIdeaTab(page, spaceId, ideaId, "milestones")
  await page.getByLabel("Milestone title").fill("Planted")
  await page.getByLabel("Target date").fill(target.iso)
  await page.getByRole("button", { name: "Add milestone" }).click()
  await expect(page.getByTestId("milestone").filter({ hasText: "Planted" })).toBeVisible()

  await page.goto(`./#/s/${spaceId}/calendar`)
  await page.getByRole("radio", { name: "Agenda" }).click()
  // The agenda shows this month first; dates in the next one are a "Show <month>" away.
  await showMonthOf(page, target.iso)
  const agenda = page.getByTestId("agenda")
  const dueDay = agenda
    .getByRole("listitem")
    .filter({ has: page.getByRole("heading", { name: dayName(due.iso) }) })
  await expect(dueDay.getByRole("link", { name: "Task due: Buy seeds" })).toBeVisible()
  await agenda.getByRole("link", { name: "Task due: Buy seeds" }).click()
  await page.waitForURL(new RegExp(`/ideas/${ideaId}/tasks$`))

  await page.goto(`./#/s/${spaceId}/calendar`)
  await showMonthOf(page, target.iso)
  const milestone = page.getByTestId("agenda").getByRole("link", { name: "Milestone: Planted" })
  await expect(milestone).toBeVisible()
  await milestone.click()
  await page.waitForURL(new RegExp(`/ideas/${ideaId}/milestones$`))
})

/** "Friday 16 October", as the agenda's day headings read. */
function dayName(iso: string): string {
  const format = new Intl.DateTimeFormat("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "UTC",
  })
  const parts = format.formatToParts(new Date(`${iso}T12:00:00Z`))
  const part = (type: string) => parts.find((p) => p.type === type)!.value
  return `${part("weekday")} ${part("day")} ${part("month")}`
}

/** Pages the agenda on until it covers the month of an ISO day. */
async function showMonthOf(page: Page, iso: string) {
  const month = new Date(`${iso}T12:00:00Z`).toLocaleString("en-GB", { month: "long" })
  const end = page.getByTestId("agenda-end")
  await expect(end).toBeVisible()
  const show = end.getByRole("button", { name: `Show ${month}` })
  if (await show.isVisible()) await show.click()
}
