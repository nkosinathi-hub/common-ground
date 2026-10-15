import { IDEA_STAGES, type Idea, type IdeaStage } from "./idea"

export interface IdeaFilter {
  readonly text?: string
  readonly tag?: string
  readonly stage?: IdeaStage
}

export function filterIdeas(ideas: readonly Idea[], filter: IdeaFilter): Idea[] {
  const text = filter.text?.trim().toLowerCase() ?? ""
  return ideas.filter((idea) => {
    if (filter.stage && idea.stage !== filter.stage) return false
    if (filter.tag && !idea.tags.includes(filter.tag)) return false
    if (!text) return true
    const haystack = [idea.title, ...Object.values(idea.brief)].join(" ").toLowerCase()
    return haystack.includes(text)
  })
}

export function allTags(ideas: readonly Idea[]): string[] {
  return [...new Set(ideas.flatMap((idea) => idea.tags))].sort()
}

export function groupByStage(ideas: readonly Idea[]) {
  return IDEA_STAGES.map((stage) => ({
    stage,
    ideas: ideas.filter((idea) => idea.stage === stage),
  }))
}
