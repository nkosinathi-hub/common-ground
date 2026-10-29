import { appError, err, ok, type Result } from "@/shared/domain"
import type { SpaceProfileGateway, SpaceProfilePatch } from "../application/ports"
import type { MediaSlot } from "../domain/media"
import type { Space } from "../domain/space"
import { parseLook } from "../domain/space-look"

/** In-memory spaces with their profile columns and a space-media bucket. */
export class FakeSpaceProfile implements SpaceProfileGateway {
  spaces: Space[] = []
  patches: SpaceProfilePatch[] = []
  objects = new Map<string, Blob>()

  async updateProfile(spaceId: string, patch: SpaceProfilePatch): Promise<Result<void>> {
    this.patches.push(patch)
    const { look, ...rest } = patch
    this.spaces = this.spaces.map((s) =>
      s.id === spaceId ? { ...s, ...rest, ...(look && { look: parseLook(look) }) } : s,
    )
    return ok(undefined)
  }

  async uploadMedia(path: string, file: Blob): Promise<Result<void>> {
    this.objects.set(path, file)
    return ok(undefined)
  }

  async setMedia(spaceId: string, slot: MediaSlot, path: string | null) {
    if (path && !this.objects.has(path)) return err(appError("not_found", "Upload it first"))
    const key = `${slot}Path` as const
    const previous = this.spaces.find((s) => s.id === spaceId)?.[key] ?? null
    this.spaces = this.spaces.map((s) => (s.id === spaceId ? { ...s, [key]: path } : s))
    return ok(previous)
  }

  async removeMedia(paths: readonly string[]): Promise<Result<void>> {
    for (const path of paths) this.objects.delete(path)
    return ok(undefined)
  }

  async signMedia(paths: readonly string[]): Promise<Result<Record<string, string>>> {
    return ok(Object.fromEntries(paths.map((path) => [path, `https://signed.test/${path}`])))
  }
}
