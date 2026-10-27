import { researchTables } from "./research-data"
import { ANA, BEN, SPACE, demoId, now, today } from "./identity"

const ideaRows = [
  { title: "A weekend in the Cederberg", stage: "planning", tags: ["travel", "together"] },
  { title: "Make a tiny garden", stage: "exploring", tags: ["home"] },
  { title: "Start a family recipe book", stage: "building", tags: ["creative"] },
].map((idea, i) => ({
  ...idea,
  id: demoId(20 + i),
  space_id: SPACE,
  template: "blank",
  currency: "ZAR",
  brief: { summary: "Make time for something we have been talking about together." },
  created_by: ANA,
  created_at: now,
  updated_at: now,
  ours: true,
  idea_collaborators: [{ user_id: BEN, invited_by: ANA, invited_at: now, accepted_at: now }],
}))
const taskRows = [
  {
    id: demoId(30),
    space_id: SPACE,
    idea_id: demoId(20),
    title: "Compare two campsites",
    description: "Find a quiet spot near the river.",
    status: "todo",
    priority: "medium",
    due_date: today,
    assignee_id: BEN,
    milestone_id: demoId(31),
    created_by: ANA,
    created_at: now,
    updated_at: now,
    ideas: { title: ideaRows[0]!.title },
  },
]
export const ideaTables = {
  ...researchTables,
  ideas: ideaRows,
  tasks: taskRows,
  idea_collaborators: [{ idea_id: demoId(20), ...ideaRows[0]!.idea_collaborators[0] }],
  milestones: [
    {
      id: demoId(31),
      space_id: SPACE,
      idea_id: demoId(20),
      title: "Ready to book",
      target_date: today,
      completed_at: null,
      created_by: ANA,
      updated_at: now,
    },
  ],
  task_checklist_items: [
    {
      id: demoId(32),
      task_id: demoId(30),
      label: "Check availability",
      done: false,
      position: 0,
      created_by: BEN,
    },
  ],
  budget_entries: [
    {
      id: demoId(36),
      idea_id: demoId(20),
      category: "Travel",
      label: "Campsite",
      estimated_minor: 120000,
      actual_minor: null,
      created_by: ANA,
      created_at: now,
      updated_at: now,
    },
  ],
}
