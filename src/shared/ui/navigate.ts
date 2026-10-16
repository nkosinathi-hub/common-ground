import { buildHash, type Route } from "@/shared/domain"

/**
 * The one way features move to another page: the hash router follows `hashchange`, so history
 * and back work. Pass a Route, or a hash a parent built with buildHash.
 */
export function navigate(to: Route | string): void {
  location.hash = typeof to === "string" ? to : buildHash(to)
}
