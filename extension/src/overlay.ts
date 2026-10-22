import { button, el } from "./dom"
import type { OverlayModel } from "./overlay-model"

export interface OverlayActions {
  ready: () => void
  play: () => void
  pause: () => void
}

// Right edge, below Netflix's top bar and well above its bottom controls; never over them.
const STYLE = `
:host { all: initial; }
.box { position: fixed; top: 96px; right: 16px; width: 232px; max-height: 40vh; overflow: auto;
  z-index: 2147483647; padding: 10px 12px; border-radius: 10px; background: rgb(20 20 20 / 0.88);
  color: #f5f5f5; font: 13px/1.4 system-ui, sans-serif; box-shadow: 0 2px 12px rgb(0 0 0 / 0.5); }
.box.small { width: auto; }
h2 { font-size: 13px; margin: 0 0 6px; } ul { list-style: none; margin: 0 0 6px; padding: 0; }
li { display: flex; justify-content: space-between; gap: 8px; } .muted { color: #b5b5b5; }
p { margin: 0 0 6px; } .row { display: flex; flex-wrap: wrap; gap: 6px; }
button { font: inherit; padding: 4px 10px; border: 0; border-radius: 6px; cursor: pointer;
  background: #f5f5f5; color: #141414; } button:disabled { opacity: 0.5; cursor: default; }
button.quiet { background: transparent; color: #f5f5f5; text-decoration: underline; }`

/** The party's small in-page panel, in a closed shadow root so Netflix's styles never reach it. */
export function mountOverlay(doc: Document, actions: OverlayActions) {
  const host = el(doc, "div", { "data-common-ground": "" })
  const root = host.attachShadow({ mode: "closed" })
  const box = el(doc, "section", { class: "box", "aria-label": "Common Ground party" })
  root.append(el(doc, "style", {}, STYLE), box)
  let small = false
  let last: OverlayModel | string = ""
  // In fullscreen only the fullscreen element shows, so the panel moves into it.
  const place = () => (doc.fullscreenElement ?? doc.body).append(host)
  doc.addEventListener("fullscreenchange", place)
  place()

  const toggle = () => {
    small = !small
    render(last)
  }

  function body(model: OverlayModel): Node[] {
    const people = model.people.map((p) =>
      el(doc, "li", {}, p.name, el(doc, "span", { class: "muted" }, p.status)),
    )
    const play =
      model.play &&
      button(doc, model.play === "start" ? "Play together" : "Resume", actions.play, !model.canPlay)
    const controls = el(
      doc,
      "div",
      { class: "row" },
      model.ready && button(doc, "Ready", actions.ready),
      play,
      model.pause && button(doc, "Pause", actions.pause),
    )
    return [el(doc, "ul", {}, ...people), el(doc, "p", {}, model.line), controls]
  }

  function render(model: OverlayModel | string): void {
    last = model
    box.className = small ? "box small" : "box"
    const heading = typeof model === "string" ? "Common Ground party" : model.heading
    const hide = button(doc, small ? "Show party" : "Hide", toggle)
    hide.className = "quiet"
    if (small) return void box.replaceChildren(hide)
    const content = typeof model === "string" ? [el(doc, "p", {}, model)] : body(model)
    box.replaceChildren(el(doc, "h2", {}, heading), ...content, hide)
  }

  return {
    render,
    /** For tests: the closed root is never handed to the page. */
    root,
    remove() {
      doc.removeEventListener("fullscreenchange", place)
      host.remove()
    },
  }
}
