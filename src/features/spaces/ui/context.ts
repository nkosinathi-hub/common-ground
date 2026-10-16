import { getContext, setContext } from "svelte"
import type { SpacesService } from "../application/spaces-service"
import type { SpacesStore } from "./spaces-store.svelte"

export interface SpacesContext {
  readonly service: SpacesService
  readonly store: SpacesStore
}

const KEY = Symbol("spaces")

export function provideSpaces(value: SpacesContext): void {
  setContext(KEY, value)
}

export function useSpaces(): SpacesContext {
  const value = getContext<SpacesContext | undefined>(KEY)
  if (!value) throw new Error("Spaces is not provided: call provideSpaces in the composition root")
  return value
}
