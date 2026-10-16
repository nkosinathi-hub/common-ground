import { expect, test } from "@playwright/test"
import { createSpace, signIn } from "../support/session"
import { admin, createUser, requireStack } from "../support/stack"
import { addEvent } from "./calendar"

requireStack()

test.use({ timezoneId: "UTC" })

const iso = (ms: number) => new Date(ms).toISOString()

// #29: a reminder at the start of an event that has just begun is delivered, once. The job runs
// every minute on pg_cron; calling it with the service role keeps the test from waiting for it.
test("a due reminder notifies its attendee once", async ({ page }) => {
  test.setTimeout(180_000)
  await signIn(page, await createUser("remind"))
  const spaceId = await createSpace(page, "Reminders test")
  const start = Math.floor(Date.now() / 60_000) * 60_000
  const end = start + 3_600_000
  await addEvent(page, spaceId, {
    title: "Starting now",
    start: iso(start).slice(0, 10),
    end: iso(end).slice(0, 10),
    from: iso(start).slice(11, 16),
    to: iso(end).slice(11, 16),
    reminder: "At the start",
  })
  await expect(page.getByLabel("Remind me")).toHaveValue("0")

  const deliver = async () => {
    const { error } = await admin().rpc("deliver_event_reminders")
    if (error) throw new Error(`deliver_event_reminders: ${error.message}`)
  }
  await deliver()
  await deliver()
  await page.reload()
  await page.getByRole("button", { name: "Notifications, 1 unread" }).click()
  await expect(page.getByRole("link", { name: /A plan is coming up/ })).toHaveCount(1)
})
