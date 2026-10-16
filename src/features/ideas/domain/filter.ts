import { isOurs } from "./collaborators"
import { IDEA_STAGES, type Idea, type IdeaStage } from "./idea"

/** Ideas the viewer started, or every idea they are on (started or joined). */
export type Whose = "mine" | "ours"

export interface IdeaFilter {
  readonly text?: string
  readonly tag?: string
  readonly stage?: IdeaStage
  readonly whose?: Whose
}

const isWhose = (idea: Idea, whose: Whose | undefined, me: string) => {
  if (whose === "mine") return me !== "" && idea.createdBy === me
  return whose === "ours" ? isOurs(idea, me) : true
}

export function filterIdeas(ideas: readonly Idea[], filter: IdeaFilter, me = ""): Idea[] {
  const text = filter.text?.trim().toLowerCase() ?? ""
  return ideas.filter((idea) => {
    if (!isWhose(idea, filter.whose, me)) return false
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
