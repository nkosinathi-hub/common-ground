import { expect, type Page, type Response } from "@playwright/test"

/** The card of one task on the tasks tab. */
export const taskCard = (page: Page, title: string) =>
  page.getByTestId("task-card").filter({ hasText: title })

/** Resolves when the next write to a REST table succeeds. */
export function written(page: Page, table: string): Promise<Response> {
  return page.waitForResponse(
    (r) => r.url().includes(`/rest/v1/${table}`) && r.request().method() !== "GET" && r.ok(),
  )
}

/** Adds a task on the tasks tab, with an optional date-only due date (YYYY-MM-DD). */
export async function addTask(page: Page, title: string, due = ""): Promise<void> {
  const form = page.getByRole("form", { name: "Add a task" })
  await form.getByLabel("Task title").fill(title)
  if (due) await form.getByLabel("Due").fill(due)
  await form.getByRole("button", { name: "Add task" }).click()
  await expect(taskCard(page, title)).toBeVisible()
}

/** Picks a value in one of a task card's selects and waits for the write. */
export async function setTaskField(page: Page, title: string, field: string, label: string) {
  const saved = written(page, "tasks")
  await taskCard(page, title).getByLabel(field).selectOption({ label })
  await saved
}
