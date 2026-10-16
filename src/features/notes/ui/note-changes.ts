import type { NoteArrivals } from "../application/ports"

/** Tells every notes view on the page that something changed here: read, responded or sent. */
export class NoteChanges implements NoteArrivals {
  private readonly listeners = new Set<() => void>()

  subscribe(onChange: () => void): () => void {
    this.listeners.add(onChange)
    return () => {
      this.listeners.delete(onChange)
    }
  }

  emit(): void {
    for (const listener of [...this.listeners]) listener()
  }
}
