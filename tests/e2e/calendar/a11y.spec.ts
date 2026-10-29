import { test } from "@playwright/test"
import { expectAccessible } from "../support/a11y"
import { daysFromNow } from "../support/dates"
import { createSpace, projectPage, signIn } from "../support/session"
import { createUser, requireStack } from "../support/stack"
import { addEvent } from "./calendar"

requireStack()

// #29: the month grid, the agenda and an event page pass axe with a sound heading outline.
test("calendar views and an event page are accessible @a11y", async ({ browser }) => {
  test.setTimeout(150_000)
  const page = await projectPage(browser, { timezoneId: "Europe/London" })
  await signIn(page, await createUser("calaxe"))
  const spaceId = await createSpace(page, "Calendar a11y")
  const day = daysFromNow(1).iso
  const eventId = await addEvent(page, spaceId, {
    title: "Picnic",
    start: day,
    from: "12:00",
    to: "14:00",
  })
  await page.goto(`./#/s/${spaceId}/calendar/${eventId}`)
  await expectAccessible(page)
  for (const view of ["Month", "Agenda"]) {
    await page.goto(`./#/s/${spaceId}/calendar`)
    await page.getByRole("radio", { name: view }).click()
    await expectAccessible(page)
  }
  await page.context().close()
})
