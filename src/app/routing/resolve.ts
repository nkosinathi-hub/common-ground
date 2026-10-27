import type { Route } from "@/shared/domain"

export interface Gate {
  readonly signedIn: boolean
  readonly spaceIds: readonly string[]
  readonly activeSpaceId: string | null
  readonly pendingInvite: string | null
}

export type Decision = { kind: "render"; route: Route } | { kind: "redirect"; route: Route }

const PUBLIC = new Set<Route["name"]>([
  "demo",
  "sign-in",
  "sign-up",
  "reset",
  "privacy",
  "not-found",
])
const AUTH_ONLY = new Set<Route["name"]>(["sign-in", "sign-up"])

const render = (route: Route): Decision => ({ kind: "render", route })
const redirect = (route: Route): Decision => ({ kind: "redirect", route })

/** Decides what to show for a route given the session; private routes never render signed out. */
export function resolveRoute(route: Route, gate: Gate): Decision {
  if (!gate.signedIn) {
    if (PUBLIC.has(route.name)) return render(route)
    return route.name === "invite" ? render(route) : redirect({ name: "sign-in" })
  }
  if (gate.pendingInvite && route.name !== "invite") {
    return redirect({ name: "invite", token: gate.pendingInvite })
  }
  if (AUTH_ONLY.has(route.name) || route.name === "entry") {
    const home = gate.activeSpaceId ?? gate.spaceIds[0]
    return redirect(home ? { name: "home", spaceId: home } : { name: "new-space" })
  }
  if ("spaceId" in route && !gate.spaceIds.includes(route.spaceId)) {
    return render({ name: "not-found" })
  }
  return render(route)
}
