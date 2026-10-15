import type { Services } from "./composition"
import { handleAuthCallback } from "./callback"
import type { Router } from "./routing/router.svelte"

export interface BootResult {
  readonly linkExpired: boolean
}

/** Finishes any emailed auth link first, then restores the session. Nothing private renders before. */
export async function boot(services: Services, router: Router): Promise<BootResult> {
  const outcome = await handleAuthCallback(services.auth)
  if (outcome === "new-password") router.go({ name: "new-password" }, true)
  await services.session.start()
  return { linkExpired: outcome === "expired" }
}
