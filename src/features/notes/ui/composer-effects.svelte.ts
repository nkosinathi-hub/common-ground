import type { ComposerState } from "./composer.svelte"

/**
 * Call during component setup: every edit may save the draft, hiding the tab saves at once,
 * and closing the composer saves what is left.
 */
export function autosaveWhileOpen(composer: ComposerState): void {
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
  $effect(() => composer.close)
}
