import { makeBudgetUseCases, provideBudget, SupabaseBudget } from "@/features/budget"
import { IdeasService, provideIdeas, provideResearch, ResearchService } from "@/features/ideas"
import { SupabaseIdeas } from "@/features/ideas/infrastructure/supabase-ideas"
import { SupabaseResearch } from "@/features/ideas/infrastructure/supabase-research"
import {
  makeTasksUseCases,
  provideTasks,
  SupabaseChecklist,
  SupabaseMilestones,
  SupabaseTasks,
  type MemberDirectory,
} from "@/features/tasks"
import type { Db } from "@/shared/infrastructure/supabase"

export function composeIdeas(db: Db, members: MemberDirectory) {
  return {
    ideas: new IdeasService(new SupabaseIdeas(db)),
    research: new ResearchService(new SupabaseResearch(db)),
    tasks: makeTasksUseCases({
      tasks: new SupabaseTasks(db),
      checklist: new SupabaseChecklist(db),
      milestones: new SupabaseMilestones(db),
      members,
    }),
    budget: makeBudgetUseCases(new SupabaseBudget(db)),
  }
}

export function provideIdeasFeatures(services: ReturnType<typeof composeIdeas>): void {
  provideIdeas(services.ideas)
  provideResearch(services.research)
  provideTasks(services.tasks)
  provideBudget(services.budget)
}
