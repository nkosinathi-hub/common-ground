import { untrack } from "svelte"
import type { AppError } from "@/shared/domain"
import type { SpacesService } from "../application/spaces-service"
import type { Space } from "../domain/space"

/** Memberships for the signed-in user. Cleared on sign-out so no content lingers. */
export class SpacesStore {
  spaces = $state<Space[]>([])
  active = $state<Space | null>(null)
  status = $state<"idle" | "loading" | "ready" | "error">("idle")
  error = $state<AppError | null>(null)

  constructor(private readonly service: SpacesService) {}

  async refresh(): Promise<void> {
    untrack(() => (this.status = this.status === "ready" ? "ready" : "loading"))
    const loaded = await this.service.load()
    if (!loaded.ok) {
      this.status = "error"
      this.error = loaded.error
      return
    }
    this.spaces = loaded.value.spaces
    this.active = loaded.value.active
    this.status = "ready"
  }

  /** Route says which space; only accept it if the user is a member. */
  activate(spaceId: string): boolean {
    return untrack(() => {
      const found = this.spaces.find((s) => s.id === spaceId) ?? null
      if (found && found.id !== this.active?.id) this.service.select(found.id)
      if (found?.id !== this.active?.id) this.active = found
      return found !== null
    })
  }

  clear() {
    if (untrack(() => this.status === "idle")) return
    this.spaces = []
    this.active = null
    this.status = "idle"
    this.service.forget()
  }
}
