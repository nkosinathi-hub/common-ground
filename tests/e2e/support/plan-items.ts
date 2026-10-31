import type { Page } from "@playwright/test"
import { byTestId, type ItemKind } from "./item-kind"
import { addTask, taskCard } from "./tasks"

const HOLDER = "Checklist holder"

/** Opens a row's editor unless it is already open (a cancelled delete leaves it open). */
async function openEditor(page: Page, name: string) {
  const edit = page.getByRole("button", { name })
  if (await edit.isVisible()) await edit.click()
}

/** The checklist shows on the card; its field opens from "Add checklist item". */
async function openChecklistField(page: Page) {
  const field = taskCard(page, HOLDER).getByLabel("New checklist item")
  if (await field.isVisible()) return
  await taskCard(page, HOLDER).getByRole("button", { name: "Add checklist item" }).click()
}

/** Tasks, checklist items, milestones and budget lines. */
export const PLAN_KINDS: readonly ItemKind[] = [
  {
    name: "task",
    tab: "tasks",
    add: (page, text) => addTask(page, text),
    row: byTestId("task-card"),
    deleteLabel: () => "Delete task",
    deleteRole: "menuitem",
    openForDelete: (page, text) =>
      taskCard(page, text)
        .getByRole("button", { name: `Actions for ${text}` })
        .click(),
  },
  {
    name: "checklist item",
    tab: "tasks",
    add: async (page, text) => {
      if ((await taskCard(page, HOLDER).count()) === 0) await addTask(page, HOLDER)
      await openChecklistField(page)
      await taskCard(page, HOLDER).getByLabel("New checklist item").fill(text)
      await taskCard(page, HOLDER).getByLabel("New checklist item").press("Enter")
    },
    row: (page, text) => taskCard(page, HOLDER).getByRole("listitem").filter({ hasText: text }),
    deleteLabel: (text) => `Remove ${text}`,
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
    openForDelete: (page, text) => openEditor(page, `Edit milestone ${text}`),
  },
  {
    name: "budget line",
    tab: "milestones",
    add: async (page, text) => {
      const form = page.getByRole("form", { name: "Add budget item" })
      await form.getByLabel("Category").fill("Costs")
      await form.getByLabel("Item").fill(text)
      await form.getByLabel(/^Estimated/).fill("10")
      await form.getByRole("button", { name: "Add", exact: true }).click()
    },
    row: byTestId("budget-line"),
    deleteLabel: (text) => `Delete ${text}`,
    openForDelete: (page, text) => openEditor(page, `Edit ${text}`),
  },
]
