import { untrack } from "svelte"
import { storedLook } from "../../domain/look"
import { DEFAULT_LOOK, type SpaceLook } from "../../domain/space-look"

/** The look being edited: changes show in the preview at once and reach the space on save. */
export class LookDraft {
  look = $state<SpaceLook>(DEFAULT_LOOK)

  constructor(private readonly saved: () => SpaceLook) {
    this.look = untrack(saved)
  }

  get dirty(): boolean {
    return JSON.stringify(storedLook(this.look)) !== JSON.stringify(storedLook(this.saved()))
  }

  set<K extends keyof SpaceLook>(key: K, value: SpaceLook[K]): void {
    this.look = { ...this.look, [key]: value }
  }

  /** Back to the design defaults (indigo, soft, comfortable); saving makes it stick. */
  reset(): void {
    this.look = DEFAULT_LOOK
  }
}
