import { makeBudgetUseCases, provideBudget, SupabaseBudget } from "@/features/budget"
import {
  makeIdeasUseCases,
  makeResearchUseCases,
  provideIdeas,
  provideResearch,
  SupabaseIdeas,
  supabaseResearch,
} from "@/features/ideas"
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
    ideas: makeIdeasUseCases(new SupabaseIdeas(db)),
    research: makeResearchUseCases(supabaseResearch(db)),
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
