import { err, toDateOnly } from "@/shared/domain"
import { type Cursor } from "@/shared/domain"
import { nextPosition, validateLabel, validateMilestone, validateTaskInput } from "../domain"
import type { ChecklistItem, MilestoneInput, TaskInput, TaskPriority, TaskStatus } from "../domain"
import type {
  ChecklistRepository,
  MemberDirectory,
  MilestonesRepository,
  TasksRepository,
} from "./ports"

export interface TasksDeps {
  readonly tasks: TasksRepository
  readonly checklist: ChecklistRepository
  readonly milestones: MilestonesRepository
  readonly members: MemberDirectory
}

export function makeTasksUseCases({ tasks, checklist, milestones, members }: TasksDeps) {
  return {
    members: (spaceId: string) => members.members(spaceId),
    list: (ideaId: string, after: Cursor | null) => tasks.list(ideaId, after),
    remove: (id: string) => tasks.remove(id),

    async create(spaceId: string, ideaId: string, input: TaskInput) {
      const valid = validateTaskInput(input)
      return valid.ok ? tasks.create({ spaceId, ideaId, ...valid.value }) : valid
    },
    async rename(id: string, title: string) {
      const valid = validateTaskInput({ title, dueDate: null })
      return valid.ok ? tasks.update(id, { title: valid.value.title }) : valid
    },
    async setDue(id: string, dueDate: string | null) {
      if (!dueDate) return tasks.update(id, { dueDate: null })
      const due = toDateOnly(dueDate)
      return due.ok
        ? tasks.update(id, { dueDate: due.value })
        : err({ ...due.error, field: "dueDate" })
    },
    move: (id: string, status: TaskStatus) => tasks.update(id, { status }),
    prioritize: (id: string, priority: TaskPriority) => tasks.update(id, { priority }),
    describe: (id: string, description: string) =>
      tasks.update(id, { description: description.trim() }),
    assign: (id: string, assigneeId: string | null) => tasks.update(id, { assigneeId }),
    linkMilestone: (id: string, milestoneId: string | null) => tasks.update(id, { milestoneId }),

    checklist: (taskId: string) => checklist.list(taskId),
    async addItem(
      spaceId: string,
      taskId: string,
      label: string,
      existing: readonly ChecklistItem[],
    ) {
      const valid = validateLabel(label)
      return valid.ok ? checklist.add(spaceId, taskId, valid.value, nextPosition(existing)) : valid
    },
    toggleItem: (id: string, done: boolean) => checklist.update(id, { done }),
    removeItem: (id: string) => checklist.remove(id),

    milestones: (ideaId: string) => milestones.list(ideaId),
    async addMilestone(spaceId: string, ideaId: string, input: MilestoneInput) {
      const valid = validateMilestone(input)
      return valid.ok
        ? milestones.create(spaceId, ideaId, valid.value.title, valid.value.targetDate)
        : valid
    },
    completeMilestone: (id: string, done: boolean, now = new Date()) =>
      milestones.update(id, { completedAt: done ? now.toISOString() : null }),
    async retargetMilestone(id: string, input: MilestoneInput) {
      const valid = validateMilestone(input)
      return valid.ok ? milestones.update(id, valid.value) : valid
    },
    removeMilestone: (id: string) => milestones.remove(id),
  }
}

export type TasksUseCases = ReturnType<typeof makeTasksUseCases>
