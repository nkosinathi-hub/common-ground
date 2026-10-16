import { appError, err, ok, type Result } from "@/shared/domain"
import { settle } from "@/shared/infrastructure/query"
import type { Db } from "@/shared/infrastructure/supabase"
import type { SpaceProfileGateway, SpaceProfilePatch } from "../application/ports"
import type { MediaSlot } from "../domain/media"
import { profileColumns } from "./space-row"
import { SupabaseSpaceMedia } from "./supabase-space-media"

const NOT_OWNER = "Only the owner can change this space"

/** Owner-only space columns and pictures. Updates select the row back: RLS refuses silently. */
export class SupabaseSpaceProfile implements SpaceProfileGateway {
  private readonly media: SupabaseSpaceMedia

  constructor(private readonly db: Db) {
    this.media = new SupabaseSpaceMedia(db)
  }

  async updateProfile(spaceId: string, patch: SpaceProfilePatch): Promise<Result<void>> {
    const query = this.db.from("spaces").update(profileColumns(patch)).eq("id", spaceId)
    const touched = await settle(query.select("id"), (rows) => rows.length > 0)
    if (!touched.ok) return touched
    return touched.value ? ok(undefined) : err(appError("denied", NOT_OWNER))
  }

  setMedia = (spaceId: string, slot: MediaSlot, path: string | null) =>
    settle(
      this.db.rpc("set_space_media", {
        target_space: spaceId,
        slot,
        object_path: path as string,
      }),
      (previous): string | null => previous ?? null,
    )

  uploadMedia = (path: string, file: Blob) => this.media.upload(path, file)
  removeMedia = (paths: readonly string[]) => this.media.remove(paths)
  signMedia = (paths: readonly string[], seconds: number) => this.media.sign(paths, seconds)
}
