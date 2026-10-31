import { demoUser } from "./identity"
import { demoCatalog } from "./catalog"
import { calendarRows } from "./calendar-data"
import { demoEpisodeStatuses } from "./episode-data"
import { watchRows } from "./watch-data"
import { demoForYou, sortForYou } from "./for-you-rows"
import { selectRows } from "./query"
import { tables } from "./tables"

export const DEMO_READ_ONLY =
  "Sample demo: changes are not saved. You can explore every form without changing a real space."
const json = (body: unknown, status = 200, headers = {}) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...headers },
  })
const blocked = () => json({ code: "P0001", message: DEMO_READ_ONLY }, 400)

/** This is the entire sample backend. It never forwards any request to the network. */
export const demoFetch: typeof fetch = async (input, init) => {
  const request = new Request(input, init)
  const url = new URL(request.url)
  if (url.origin !== "https://demo.invalid") return blocked()
  if (url.pathname === "/auth/v1/user" && request.method === "GET") return json(demoUser)
  if (url.pathname === "/functions/v1/catalog")
    return json(demoCatalog((await request.json()) as Record<string, unknown>))
  if (url.pathname === "/functions/v1/simkl")
    return json({ error: { kind: "denied", message: DEMO_READ_ONLY } }, 403)
  if (url.pathname.startsWith("/rest/v1/rpc/")) {
    const name = url.pathname.split("/").at(-1)
    const args = (await request.json()) as Record<string, unknown>
    if (name === "is_space_owner") return json(true)
    if (name === "mark_note_read") return json(null)
    if (name === "list_calendar") return json(calendarRows)
    if (name === "episode_statuses") return json(demoEpisodeStatuses(args.target_item))
    if (name === "watch_for_you")
      return json(
        demoForYou(args.target_space).map((s) => ({
          item_id: s.itemId,
          score: s.score,
          reason: s.reason,
          opinion: s.opinion,
        })),
      )
    if (name === "list_watch_items") {
      const rows = watchRows.filter(
        (row) =>
          row.space_id === args.target_space &&
          (!args.media || row.media_type === args.media) &&
          (!args.intent || row.shared_intent === args.intent) &&
          (!args.my_status || row.my_progress === args.my_status) &&
          row.title
            .toLowerCase()
            .includes((typeof args.search === "string" ? args.search : "").toLowerCase()),
      )
      if (args.sort_by === "for_you") return json(sortForYou(rows, args.target_space))
      return json(
        args.sort_by === "title" ? [...rows].sort((a, b) => a.title.localeCompare(b.title)) : rows,
      )
    }
    return blocked()
  }
  if (!url.pathname.startsWith("/rest/v1/") || !["GET", "HEAD"].includes(request.method))
    return blocked()
  const table = url.pathname.split("/").at(-1)!
  const rows = selectRows(tables[table] ?? [], url.searchParams)
  const headers = { "Content-Range": `0-${Math.max(0, rows.length - 1)}/${rows.length}` }
  if (request.method === "HEAD") return new Response(null, { status: 200, headers })
  if (request.headers.get("Accept")?.includes("vnd.pgrst.object")) {
    return rows[0] ? json(rows[0]) : json({ code: "PGRST116", message: "No sample row" }, 406)
  }
  return json(rows, 200, headers)
}
