import { BudgetService, provideBudget } from "@/features/budget"
import { SupabaseBudget } from "@/features/budget/infrastructure/supabase-budget"
import { IdeasService, provideIdeas, provideResearch, ResearchService } from "@/features/ideas"
import { SupabaseCollaborators } from "@/features/ideas/infrastructure/supabase-collaborators"
import { SupabaseIdeas } from "@/features/ideas/infrastructure/supabase-ideas"
import { SupabaseResearch } from "@/features/ideas/infrastructure/supabase-research"
import { ChecklistService, MilestonesService, provideTasks, TasksService } from "@/features/tasks"
import { SupabaseChecklist } from "@/features/tasks/infrastructure/supabase-checklist"
import { SupabaseMilestones } from "@/features/tasks/infrastructure/supabase-milestones"
import { SupabaseTasks } from "@/features/tasks/infrastructure/supabase-tasks"
import type { AuthorDirectory, MemberDirectory } from "@/shared/domain"
import type { Db } from "@/shared/infrastructure/supabase"

export function composeIdeas(db: Db, members: MemberDirectory, authors?: AuthorDirectory) {
  return {
    ideas: new IdeasService(new SupabaseIdeas(db), new SupabaseCollaborators(db), members, authors),
    research: new ResearchService(new SupabaseResearch(db)),
    tasks: {
      tasks: new TasksService(new SupabaseTasks(db), members),
      checklist: new ChecklistService(new SupabaseChecklist(db)),
      milestones: new MilestonesService(new SupabaseMilestones(db)),
    },
    budget: new BudgetService(new SupabaseBudget(db)),
  }
}

export function provideIdeasFeatures(services: ReturnType<typeof composeIdeas>): void {
  provideIdeas({ service: services.ideas })
  provideResearch({ service: services.research })
  provideTasks(services.tasks)
  provideBudget({ service: services.budget })
}
