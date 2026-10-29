import { expect, type Page, type Response } from "@playwright/test"

/** The card of one task on the tasks tab. */
export const taskCard = (page: Page, title: string) =>
  page.getByTestId("task-card").filter({ hasText: title })

const WRITES = new Set(["POST", "PATCH", "DELETE"])

/** Resolves when the next write to a REST table succeeds; preflights and reads do not count. */
export function written(page: Page, table: string): Promise<Response> {
  return page.waitForResponse(
    (r) => r.url().includes(`/rest/v1/${table}`) && WRITES.has(r.request().method()) && r.ok(),
  )
}

/** Adds a task on the tasks tab, with an optional date-only due date (YYYY-MM-DD). */
export async function addTask(page: Page, title: string, due = ""): Promise<void> {
  const form = page.getByRole("form", { name: "Add a task" })
  await form.getByLabel("New task").fill(title)
  if (due) await form.getByLabel("Due date").fill(due)
  await form.getByRole("button", { name: "Add task" }).click()
  await expect(taskCard(page, title)).toBeVisible()
}

/** Opens a task's editor (S08), picks a value in one of its selects, saves and waits. */
export async function setTaskField(page: Page, title: string, field: string, label: string) {
  await taskCard(page, title)
    .getByRole("button", { name: `Edit ${title}` })
    .click()
  const editor = page.getByRole("dialog", { name: "Edit task" })
  await editor.getByLabel(field).selectOption({ label })
  const saved = written(page, "tasks")
  await editor.getByRole("button", { name: "Save task" }).click()
  await saved
  await expect(editor).toBeHidden()
}
