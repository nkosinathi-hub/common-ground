import type { BriefField, HypothesisStatus, IdeaStage } from "../domain"

export const STAGE_LABELS: Record<IdeaStage, string> = {
  inbox: "Inbox",
  exploring: "Exploring",
  planning: "Planning",
  building: "Building",
  launched: "Launched",
  paused: "Paused",
  archived: "Archived",
}

export const BRIEF_LABELS: Record<BriefField, string> = {
  pitch: "One-line pitch",
  problem: "The problem",
  audience: "Who it is for",
  solution: "The solution",
  valueProposition: "Value proposition",
  revenueModel: "Revenue model",
  successMeasures: "How we will know it worked",
  nextStep: "Next step",
}

export const HYPOTHESIS_LABELS: Record<HypothesisStatus, string> = {
  untested: "Untested",
  validated: "Validated",
  invalidated: "Invalidated",
}
