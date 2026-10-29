import type { Idea } from "../domain"

const CAPTURED = "idea-captured"

/** Tells an open ideas list that the capture dialog saved an idea, so it shows without a reload. */
export function announceCaptured(idea: Idea): void {
  window.dispatchEvent(new CustomEvent<Idea>(CAPTURED, { detail: idea }))
}

/** Calls handler for each idea captured elsewhere; returns the unsubscribe. */
export function onCaptured(handler: (idea: Idea) => void): () => void {
  const listener = (event: Event) => handler((event as CustomEvent<Idea>).detail)
  window.addEventListener(CAPTURED, listener)
  return () => window.removeEventListener(CAPTURED, listener)
}
