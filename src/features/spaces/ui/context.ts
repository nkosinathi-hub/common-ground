import { getContext, setContext } from "svelte"
import type { SpacesService } from "../application/spaces-service"
import type { SpacesStore } from "./spaces.svelte"

const KEY = Symbol("spaces")

export interface SpacesContext {
  readonly service: SpacesService
  readonly store: SpacesStore
}

export const provideSpaces = (value: SpacesContext) => setContext(KEY, value)
export const useSpaces = (): SpacesContext => getContext<SpacesContext>(KEY)
