import { getContext, setContext } from "svelte"
import type { AuthService } from "../application/auth-service"
import type { SessionStore } from "./session-store.svelte"

export interface AuthContext {
  readonly service: AuthService
  readonly session: SessionStore
}

const KEY = Symbol("auth")

export function provideAuth(value: AuthContext): void {
  setContext(KEY, value)
}

export function useAuth(): AuthContext {
  const value = getContext<AuthContext | undefined>(KEY)
  if (!value) throw new Error("Auth is not provided: call provideAuth in the composition root")
  return value
}
