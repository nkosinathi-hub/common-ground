import type { Page } from "@playwright/test"
import { byTestId, type ItemKind } from "./item-kind"
import { addTask, taskCard } from "./tasks"

const HOLDER = "Checklist holder"

async function openChecklist(page: Page) {
  // Before the first checklist item there is no holder task to open.
  if ((await taskCard(page, HOLDER).count()) === 0) return
  const toggle = taskCard(page, HOLDER).getByRole("button", { name: "Checklist", exact: true })
  if ((await toggle.getAttribute("aria-expanded")) !== "true") await toggle.click()
}

/** Tasks, checklist items, milestones and budget lines. */
export const PLAN_KINDS: readonly ItemKind[] = [
  {
    name: "task",
    tab: "tasks",
    add: (page, text) => addTask(page, text),
    row: byTestId("task-card"),
    deleteLabel: (text) => `Delete task ${text}`,
  },
  {
    name: "checklist item",
    tab: "tasks",
    add: async (page, text) => {
      if ((await taskCard(page, HOLDER).count()) === 0) await addTask(page, HOLDER)
      await openChecklist(page)
      await taskCard(page, HOLDER).getByLabel("New checklist item").fill(text)
      await taskCard(page, HOLDER).getByLabel("New checklist item").press("Enter")
    },
    row: (page, text) => taskCard(page, HOLDER).getByRole("listitem").filter({ hasText: text }),
    deleteLabel: (text) => `Remove ${text}`,
    reveal: openChecklist,
  },
  {
    name: "milestone",
    tab: "milestones",
    add: async (page, text) => {
      await page.getByLabel("Milestone title").fill(text)
      await page.getByRole("button", { name: "Add milestone" }).click()
    },
    row: byTestId("milestone"),
    deleteLabel: (text) => `Delete milestone ${text}`,
  },
  {
    name: "budget line",
    tab: "milestones",
    add: async (page, text) => {
      const form = page.getByRole("form", { name: "Add a budget line" })
      await form.getByLabel("Category").fill("Costs")
      await form.getByLabel("Item").fill(text)
      await form.getByLabel(/^Estimated/).fill("10")
      await form.getByRole("button", { name: "Add line" }).click()
    },
    row: (page, text) => page.getByRole("row").filter({ hasText: text }),
    deleteLabel: (text) => `Delete ${text}`,
  },
]
