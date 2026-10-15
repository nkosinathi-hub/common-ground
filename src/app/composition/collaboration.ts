import { AttachmentsService, provideAttachments } from "@/features/attachments"
import { FetchUploader } from "@/features/attachments/infrastructure/fetch-uploader"
import { SupabaseAttachmentsGateway } from "@/features/attachments/infrastructure/supabase-attachments-gateway"
import { CommentsService, provideComments } from "@/features/comments"
import { SupabaseCommentsGateway } from "@/features/comments/infrastructure/supabase-comments-gateway"
import { RecommendationsService, provideRecommendations } from "@/features/recommendations"
import { SupabaseRecommendationsGateway } from "@/features/recommendations/infrastructure/supabase-recommendations-gateway"
import type { Db } from "@/shared/infrastructure/supabase"

export function composeCollaboration(db: Db) {
  return {
    comments: new CommentsService(new SupabaseCommentsGateway(db)),
    recommendations: new RecommendationsService(new SupabaseRecommendationsGateway(db)),
    attachments: new AttachmentsService(new SupabaseAttachmentsGateway(db), new FetchUploader()),
  }
}

export function provideCollaboration(services: ReturnType<typeof composeCollaboration>): void {
  provideComments({ service: services.comments })
  provideRecommendations({ service: services.recommendations })
  provideAttachments({ service: services.attachments })
}
