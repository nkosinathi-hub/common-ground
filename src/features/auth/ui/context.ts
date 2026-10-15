import { getContext, setContext } from "svelte"
import type { AuthService } from "../application/auth-service"
import type { SessionStore } from "./session.svelte"

const KEY = Symbol("auth")

export interface AuthContext {
  readonly service: AuthService
  readonly session: SessionStore
}

export const provideAuth = (value: AuthContext) => setContext(KEY, value)
export const useAuth = (): AuthContext => getContext<AuthContext>(KEY)
