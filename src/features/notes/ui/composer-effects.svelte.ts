import type { ComposerState } from "./composer-state.svelte"

/**
 * Call during component setup: every edit may save the draft, hiding the tab saves at once,
 * and closing the composer saves what is left, then calls `onClosed`.
 */
export function autosaveWhileOpen(composer: ComposerState, onClosed: () => void): void {
  $effect(() => {
    void JSON.stringify(composer.fields())
    composer.edited()
  })
  $effect(() => {
    const hidden = () => {
      if (document.visibilityState === "hidden") void composer.autosave.flush()
    }
    document.addEventListener("visibilitychange", hidden)
    return () => document.removeEventListener("visibilitychange", hidden)
  })
  $effect(() => () => void composer.close().then(onClosed))
}
