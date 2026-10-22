import { button, el } from "./dom"
import type { PartyRow } from "./party-list"

/** Email and password, as on the Common Ground sign-in page. */
export function signInForm(doc: Document, submit: (email: string, password: string) => void) {
  const email = el(doc, "input", {
    type: "email",
    id: "email",
    autocomplete: "email",
    required: "",
  })
  const password = el(doc, "input", {
    type: "password",
    id: "password",
    autocomplete: "current-password",
    required: "",
  })
  const form = el(
    doc,
    "form",
    {},
    el(doc, "h1", {}, "Sign in to Common Ground"),
    el(doc, "label", { for: "email" }, "Email"),
    email,
    el(doc, "label", { for: "password" }, "Password"),
    password,
    el(doc, "button", { type: "submit" }, "Sign in"),
  )
  form.addEventListener("submit", (event) => {
    event.preventDefault()
    submit(email.value.trim(), password.value)
  })
  return form
}

function partyItem(doc: Document, row: PartyRow, join: (row: PartyRow) => void) {
  const people = row.people.map((p) =>
    el(
      doc,
      "li",
      {},
      `${p.name}${p.host ? " (host)" : ""}`,
      el(doc, "span", {}, p.ready ? "Ready" : "Not ready"),
    ),
  )
  const open = el(
    doc,
    "a",
    { href: row.netflixUrl, target: "_blank", rel: "noopener noreferrer" },
    "Open on Netflix",
  )
  return el(
    doc,
    "li",
    { class: "party" },
    el(doc, "h2", {}, row.title),
    el(doc, "p", { class: "muted" }, row.what),
    el(doc, "ul", { class: "people" }, ...people),
    row.active
      ? el(doc, "p", {}, "Joined. Open the title on netflix.com and press Ready there.")
      : button(doc, row.joined ? "Play it here" : "Join", () => join(row)),
    open,
  )
}

/** The open Netflix parties in the member's spaces, and signing out. */
export function partyList(
  doc: Document,
  rows: readonly PartyRow[],
  actions: { join: (row: PartyRow) => void; signOut: () => void },
) {
  const list = rows.length
    ? el(doc, "ul", { class: "parties" }, ...rows.map((row) => partyItem(doc, row, actions.join)))
    : el(doc, "p", {}, "No Netflix party is open. Start one from a title in the Common Ground app.")
  return el(
    doc,
    "div",
    {},
    el(doc, "h1", {}, "Netflix parties"),
    list,
    button(doc, "Sign out", actions.signOut),
  )
}
