import { json, type Handler } from "./fixture-server"

interface Item {
  readonly licenseurl?: string
  readonly files: readonly { name: string; format: string }[]
}

const PD = "http://creativecommons.org/publicdomain/mark/1.0/"
const ITEMS: Record<string, Item> = {
  "night-of-the-living-dead": {
    licenseurl: PD,
    files: [
      { name: "Night 1968.mp4", format: "MPEG4" },
      { name: "x.ogv", format: "Ogg Video" },
    ],
  },
  "no-licence": { files: [{ name: "a.mp4", format: "MPEG4" }] },
  "embed-only": { licenseurl: "https://creativecommons.org/licenses/by/4.0/", files: [] },
}

/** IMDb id (P345) to Internet Archive id (P724), as Wikidata would answer. */
const WIKIDATA: Record<string, string> = {
  tt0063350: "night-of-the-living-dead",
  tt0000002: "no-licence",
  tt0000003: "embed-only",
}

const sparql: Handler = (req, res) => {
  const query = new URL(req.url ?? "", "http://x").searchParams.get("query") ?? ""
  const id = WIKIDATA[/"(tt\d+)"/.exec(query)?.[1] ?? ""]
  json(res, { results: { bindings: id ? [{ ia: { type: "literal", value: id } }] : [] } })
}

/** Wikidata SPARQL and archive.org metadata stand-ins. */
export const archiveRoutes: Record<string, Handler> = {
  "/sparql": sparql,
  ...Object.fromEntries(
    Object.entries(ITEMS).map(([id, item]): [string, Handler] => [
      `/metadata/${id}`,
      (_req, res) => json(res, { metadata: { licenseurl: item.licenseurl }, files: item.files }),
    ]),
  ),
}
