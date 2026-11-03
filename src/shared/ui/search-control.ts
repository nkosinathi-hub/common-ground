import { getContext, setContext } from "svelte"
const KEY = Symbol("universal-search-control")
class SearchControl {
  private focus: (() => void) | null = null
  register(focus: () => void) {
    this.focus = focus
    return () => {
      if (this.focus === focus) this.focus = null
    }
  }
  open() {
    this.focus?.()
  }
}
export const provideSearchControl = () => setContext(KEY, new SearchControl())
export const useSearchControl = (): SearchControl | undefined => getContext(KEY)
