import type { Result } from "@/shared/domain"
import { toast, type FormState } from "@/shared/ui"
import type { SpacesStore } from "../spaces.svelte"

/** Runs a settings save through its form, confirms it, and reloads the spaces so the shell updates. */
export async function saveAndRefresh(
  form: FormState,
  store: SpacesStore,
  action: () => Promise<Result<unknown>>,
): Promise<boolean> {
  const result = await form.run(action)
  if (!result.ok) return false
  toast.success("Saved")
  await store.refresh()
  return true
}
