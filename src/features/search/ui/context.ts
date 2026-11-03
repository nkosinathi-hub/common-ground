import { getContext, setContext } from "svelte"
import type { SearchService } from "../application/search-service"
const KEY = Symbol("search")
export const provideSearch = (service: SearchService) => setContext(KEY, service)
export const useSearch = (): SearchService => getContext(KEY)
