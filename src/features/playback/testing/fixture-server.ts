import { readFile } from "node:fs/promises"
import { createServer, type IncomingMessage, type ServerResponse } from "node:http"
import type { AddressInfo } from "node:net"
import { join } from "node:path"

export type Handler = (req: IncomingMessage, res: ServerResponse, body: string) => void

export interface Hit {
  readonly method: string
  readonly path: string
  readonly headers: IncomingMessage["headers"]
  readonly body: string
}

const MEDIA = join(process.cwd(), "tests/fixtures/playback")
const TYPES: Record<string, string> = {
  ".m3u8": "application/vnd.apple.mpegurl",
  ".mpd": "application/dash+xml",
  ".mp4": "video/mp4",
  ".m4s": "video/iso.segment",
}

export const json = (res: ServerResponse, body: unknown, status = 200) => {
  res.writeHead(status, { "Content-Type": "application/json" })
  res.end(JSON.stringify(body))
}

/** Built-in routes: /media/* serves the committed fixtures, /slow never answers, /fail is 500. */
async function builtIn(req: IncomingMessage, res: ServerResponse, path: string) {
  if (path === "/slow") return // the client's timeout ends this request
  if (path === "/fail") return json(res, { error: "boom" }, 500)
  if (!path.startsWith("/media/") || path.includes("..")) return json(res, {}, 404)
  const file = path.slice("/media/".length)
  try {
    const bytes = await readFile(join(MEDIA, file))
    const type = TYPES[file.slice(file.lastIndexOf("."))] ?? "application/octet-stream"
    res.writeHead(200, { "Content-Type": type, "Access-Control-Allow-Origin": "*" })
    res.end(req.method === "HEAD" ? undefined : bytes)
  } catch {
    json(res, {}, 404)
  }
}

/** A real local HTTP server for integration tests; routes match the path without the query. */
export async function startFixtureServer(routes: Record<string, Handler> = {}) {
  const hits: Hit[] = []
  const server = createServer((req, res) => {
    let body = ""
    req.on("data", (chunk: Buffer) => (body += chunk.toString()))
    req.on("end", () => {
      const path = new URL(req.url ?? "/", "http://fixture").pathname
      hits.push({ method: req.method ?? "GET", path, headers: req.headers, body })
      const route = routes[`${req.method} ${path}`] ?? routes[path]
      if (route) route(req, res, body)
      else void builtIn(req, res, path)
    })
  })
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve))
  const { port } = server.address() as AddressInfo
  return {
    origin: `http://127.0.0.1:${port}`,
    hits,
    close: () =>
      new Promise<void>((resolve) => {
        server.closeAllConnections()
        server.close(() => resolve())
      }),
  }
}

export type FixtureServer = Awaited<ReturnType<typeof startFixtureServer>>
