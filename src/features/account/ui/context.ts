import { getContext, setContext } from "svelte"
import type { AccountService } from "../application/account-service"

/** Provided by src/app/composition/core.ts with the service bound to real adapters. */
export interface AccountContext {
  readonly service: AccountService
}

const KEY = Symbol("account")

/** The context entries provideAccount sets; component tests pass them to render(). */
export const accountContext = (value: AccountContext) => new Map([[KEY, value]])

export function provideAccount(value: AccountContext): void {
  setContext(KEY, value)
}

export function useAccount(): AccountContext {
  const value = getContext<AccountContext | undefined>(KEY)
  if (!value)
    throw new Error("Account is not provided: call provideAccount in the composition root")
  return value
}
