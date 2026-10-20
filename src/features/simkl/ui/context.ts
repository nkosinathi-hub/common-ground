import { getContext, setContext } from "svelte"
import type { SimklService } from "../application/simkl-service"

/** Provided by src/app/composition/core.ts with the service bound to real adapters. */
export interface SimklContext {
  readonly service: SimklService
}

const KEY = Symbol("simkl")

export function provideSimkl(value: SimklContext): void {
  setContext(KEY, value)
}

export function useSimkl(): SimklContext {
  const value = getContext<SimklContext | undefined>(KEY)
  if (!value) throw new Error("Simkl is not provided: call provideSimkl in the composition root")
  return value
}
