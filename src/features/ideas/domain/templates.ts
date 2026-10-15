import type { Brief, BriefField } from "./brief"
import type { IdeaTemplate } from "./idea"

export interface TemplateOption {
  readonly id: IdeaTemplate
  readonly label: string
  readonly description: string
  /** Fields shown first in the overview for ideas started from this template. */
  readonly focus: readonly BriefField[]
}

export const IDEA_TEMPLATE_OPTIONS: readonly TemplateOption[] = [
  { id: "blank", label: "Blank", description: "Just a title. Shape it later.", focus: [] },
  {
    id: "business",
    label: "Business idea",
    description: "Problem, audience, value and how it earns.",
    focus: [
      "pitch",
      "problem",
      "audience",
      "solution",
      "valueProposition",
      "revenueModel",
      "nextStep",
    ],
  },
  {
    id: "creative",
    label: "Creative project",
    description: "What it is, who it is for and what done looks like.",
    focus: ["pitch", "audience", "successMeasures", "nextStep"],
  },
]

/** Starting brief: an empty prompt per focus field (saved blank fields are dropped). */
export function templateBrief(id: IdeaTemplate): Brief {
  const option = IDEA_TEMPLATE_OPTIONS.find((candidate) => candidate.id === id)
  return Object.fromEntries((option?.focus ?? []).map((field) => [field, ""]))
}
