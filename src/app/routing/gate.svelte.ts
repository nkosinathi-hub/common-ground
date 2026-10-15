import type { SessionStore } from "@/features/auth"
import type { SpacesStore } from "@/features/spaces"
import { pendingInvite } from "./pending-invite"
import { resolveRoute, type Decision } from "./resolve"
import type { Router } from "./router.svelte"

/** Decides what the current route may show, from the session and the user's memberships. */
export class RouteGate {
  constructor(
    private readonly router: Router,
    private readonly session: SessionStore,
    private readonly spaces: SpacesStore,
  ) {}

  /** Memberships are known (or failed) for a signed-in user; signed-out users need none. */
  get ready(): boolean {
    return !this.session.user || this.spaces.status === "ready" || this.spaces.status === "error"
  }

  get decision(): Decision {
    const route = this.router.route
    return resolveRoute(route, {
      signedIn: Boolean(this.session.user),
      spaceIds: this.spaces.spaces.map((s) => s.id),
      activeSpaceId: this.spaces.active?.id ?? null,
      pendingInvite: route.name === "invite" ? null : pendingInvite.read(),
    })
  }

  /** An invite opened while signed out is remembered, and forgotten once it is shown signed in. */
  rememberInvite(): void {
    const route = this.router.route
    if (route.name !== "invite") return
    pendingInvite.write(this.session.user ? null : route.token)
  }
}
