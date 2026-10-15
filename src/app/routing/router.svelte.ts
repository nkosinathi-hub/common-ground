import { buildHash, parseHash, type Route } from "@/shared/domain"

/** Hash router: back/forward work because every change goes through location.hash. */
export class Router {
  route = $state<Route>(parseHash(location.hash))

  start(): () => void {
    const sync = () => (this.route = parseHash(location.hash))
    window.addEventListener("hashchange", sync)
    return () => window.removeEventListener("hashchange", sync)
  }

  go(route: Route, replace = false): void {
    const hash = buildHash(route)
    if (replace) {
      history.replaceState(history.state, "", hash)
      this.route = parseHash(hash)
    } else if (location.hash !== hash) {
      location.hash = hash
    }
  }
}
