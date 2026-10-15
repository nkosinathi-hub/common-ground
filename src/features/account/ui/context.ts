import { getContext, setContext } from "svelte"
import type { AccountService } from "../application/account-service"

/** Context key under which src/app/composition.ts provides the account feature. */
export const ACCOUNT_CONTEXT = Symbol("account")

export interface AccountContext {
  readonly service: AccountService
}

export const provideAccount = (value: AccountContext) => setContext(ACCOUNT_CONTEXT, value)

export function useAccount(): AccountContext {
  const value = getContext<AccountContext | undefined>(ACCOUNT_CONTEXT)
  if (!value)
    throw new Error("Account is not provided: call provideAccount in the composition root")
  return value
}
