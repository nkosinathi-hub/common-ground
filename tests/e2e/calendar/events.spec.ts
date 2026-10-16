import { expect, test } from "@playwright/test"
import { daysFromNow } from "../support/dates"
import { captureIdea, inviteMember } from "../support/fixtures"
import { createSpace, signIn } from "../support/session"
import { createUser, requireStack } from "../support/stack"
import { addEvent, clock, downloadText, instantIn } from "./calendar"

requireStack()

// Ana plans from London; the dinner is planned in Auckland time and must show both.
test.use({ timezoneId: "Europe/London" })

const day = daysFromNow(20)
const compact = (iso: string) => iso.replace(/-/g, "")

// #29 acceptance: all-day and timed events, editing, a linked idea, RSVP with a notification
// for the creator, and a .ics file with the right content.
test("events are planned, edited, answered and exported", async ({ page, browser }) => {
  test.setTimeout(240_000)
  const [ana, ben] = await Promise.all([createUser("ana"), createUser("ben")])
  await signIn(page, ana)
  const spaceId = await createSpace(page, "Calendar test")
  const benPage = await inviteMember(page, browser, spaceId, ben)
  await captureIdea(page, spaceId, "Market day")

  const birthday = await addEvent(page, spaceId, {
    title: "Ana's birthday",
    start: day.iso,
    yearly: true,
  })
  await expect(page.getByTestId("event-when")).toContainText("all day")
  await expect(page.getByText("Every year")).toBeVisible()
  const allDayIcs = await downloadText(page, () =>
    page.getByRole("button", { name: "Download .ics" }).click(),
  )
  expect(allDayIcs).toContain(`DTSTART;VALUE=DATE:${compact(day.iso)}`)
  expect(allDayIcs).toContain("RRULE:FREQ=YEARLY")
  expect(allDayIcs).toContain(`UID:${birthday}@common-ground`)

  const dinner = await addEvent(page, spaceId, {
    title: "Market dinner",
    start: day.iso,
    from: "19:00",
    to: "21:00",
    zone: "Pacific/Auckland",
    linkIdea: "Market day",
  })
  const starts = instantIn(day.iso, "19:00", "Pacific/Auckland")
  const london = `${clock(starts, "Europe/London")} to ${clock(starts + 7_200_000, "Europe/London")}`
  await expect(page.getByTestId("event-when")).toContainText(london)
  await expect(page.getByText("19:00 to 21:00 in Pacific/Auckland")).toBeVisible()
  await expect(page.getByRole("link", { name: "Market day" })).toHaveAttribute(
    "href",
    /\/ideas\/.+\/overview$/,
  )

  await page.getByRole("button", { name: "Edit" }).click()
  const edit = page.getByRole("dialog", { name: "Edit event" })
  await expect(edit.getByLabel("Start time")).toHaveValue("19:00")
  await edit.getByLabel("Title").fill("Market dinner and drinks")
  await edit.getByLabel("Where").fill("The night market; stall 4")
  await edit.getByRole("button", { name: "Save" }).click()
  await expect(
    page.getByRole("heading", { level: 1, name: "Market dinner and drinks" }),
  ).toBeVisible()

  await benPage.goto(`./#/s/${spaceId}/calendar/${dinner}`)
  await expect(benPage.getByTestId("rsvp-names")).toContainText("Not answered: ben")
  await benPage.getByRole("radio", { name: "Maybe (0)" }).click()
  await expect(benPage.getByTestId("rsvp-names")).toContainText("Maybe: ben")
  await benPage.context().close()

  await page.reload()
  await page.getByRole("button", { name: /^Notifications, \d+ unread$/ }).click()
  await expect(page.getByRole("link", { name: /ben replied to your plan/ })).toBeVisible()
  await page.keyboard.press("Escape")

  const ics = await downloadText(page, () =>
    page.getByRole("button", { name: "Download .ics" }).click(),
  )
  expect(ics.startsWith("BEGIN:VCALENDAR\r\n")).toBe(true)
  expect(ics).toContain("SUMMARY:Market dinner and drinks\r\n")
  expect(ics).toContain("LOCATION:The night market\\; stall 4\r\n")
  expect(ics).toContain(
    `DTSTART:${new Date(starts).toISOString().replace(/[-:]|\.\d{3}/g, "")}\r\n`,
  )
})
