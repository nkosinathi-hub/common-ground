import { expect, type Page } from "@playwright/test"

const UUID = "[0-9a-f-]{36}"

export interface EventInput {
  readonly title: string
  readonly start: string
  readonly end?: string
  /** "HH:MM"; an all-day event when absent. */
  readonly from?: string
  readonly to?: string
  readonly zone?: string
  readonly yearly?: boolean
  readonly linkIdea?: string
  readonly reminder?: string
}

/** Adds an event through the calendar's dialog, opens it and returns its id. */
export async function addEvent(page: Page, spaceId: string, input: EventInput): Promise<string> {
  await page.goto(`./#/s/${spaceId}/calendar`)
  await page.getByRole("button", { name: "New event" }).click()
  const dialog = page.getByRole("dialog", { name: "New event" })
  await expect(dialog.getByRole("checkbox").first()).toBeChecked()
  await dialog.getByLabel("Title").fill(input.title)
  if (!input.from) await dialog.getByRole("switch", { name: "All day" }).click()
  await dialog.getByLabel("Starts").fill(input.start)
  await dialog.getByLabel("Ends").fill(input.end ?? input.start)
  if (input.from) await dialog.getByLabel("Start time").fill(input.from)
  if (input.to) await dialog.getByLabel("End time").fill(input.to)
  if (input.zone) await dialog.getByLabel("Time zone").selectOption(input.zone)
  if (input.yearly) await dialog.getByRole("switch", { name: /Every year/ }).click()
  if (input.reminder)
    await dialog.getByLabel("Remind people").selectOption({ label: input.reminder })
  if (input.linkIdea) {
    await dialog.getByRole("tab", { name: "Idea" }).click()
    await dialog.getByRole("button", { name: input.linkIdea }).click()
    await expect(dialog.getByText(input.linkIdea, { exact: true })).toBeVisible()
  }
  await dialog.getByRole("button", { name: "Add event" }).click()
  await page.waitForURL(new RegExp(`/calendar/${UUID}$`))
  await expect(page.getByRole("heading", { level: 1, name: input.title })).toBeVisible()
  return new RegExp(`/calendar/(${UUID})$`).exec(page.url())![1]!
}

/** The wall-clock time ("HH:MM") an instant shows in a zone. */
export const clock = (instant: number, zone: string) =>
  new Intl.DateTimeFormat("en-GB", {
    timeZone: zone,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(instant)

/** The instant of a wall-clock time on a day in a zone (not near a DST change). */
export function instantIn(day: string, time: string, zone: string): number {
  const wall = Date.parse(`${day}T${time}:00Z`)
  const [h, m] = clock(wall, zone).split(":").map(Number) as [number, number]
  const shownDay = new Intl.DateTimeFormat("en-CA", { timeZone: zone }).format(wall)
  const dayShift = Date.parse(`${shownDay}T00:00:00Z`) - Date.parse(`${day}T00:00:00Z`)
  const offset = dayShift + (h * 60 + m) * 60_000 - (wall % 86_400_000)
  return wall - offset
}

/** Reads a download's text. */
export async function downloadText(page: Page, click: () => Promise<void>): Promise<string> {
  const [download] = await Promise.all([page.waitForEvent("download"), click()])
  const stream = await download.createReadStream()
  const chunks: Buffer[] = []
  for await (const chunk of stream) chunks.push(chunk as Buffer)
  return Buffer.concat(chunks).toString("utf8")
}
