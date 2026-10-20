import { readFileSync } from "node:fs"
import { createServer, type Server } from "node:http"
import { extname, join, normalize } from "node:path"

/** The port the Playwright build names in VITE_PLAYBACK_FIXTURE_ORIGIN (playwright.config.ts). */
const MEDIA_PORT = 4391
export const MEDIA_ORIGIN = `http://127.0.0.1:${MEDIA_PORT}`

const ROOT = join(process.cwd(), "tests/fixtures/playback")
const TYPES: Record<string, string> = {
  ".m3u8": "application/vnd.apple.mpegurl",
  ".mpd": "application/dash+xml",
  ".mp4": "video/mp4",
  ".m4s": "video/iso.segment",
}

export interface CatalogEntry {
  readonly path: string
  readonly kind?: "hls" | "dash" | "file"
  readonly quality?: number
}

/** Serves tests/fixtures/playback and a /catalog the test sets, as the fixture plugin reads it. */
export class MediaServer {
  private server: Server | null = null
  catalog: CatalogEntry[] = []
  /** Paths requested, in order, so a test can see what the player fetched. */
  readonly requests: string[] = []

  start(): Promise<void> {
    this.server = createServer((req, res) => {
      const path = new URL(req.url ?? "/", MEDIA_ORIGIN).pathname
      this.requests.push(path)
      res.setHeader("Access-Control-Allow-Origin", "*")
      res.setHeader("Access-Control-Allow-Headers", "*")
      if (req.method === "OPTIONS") return void res.writeHead(204).end()
      if (path === "/catalog") {
        res.writeHead(200, { "content-type": "application/json" })
        return void res.end(JSON.stringify({ sources: this.catalog }))
      }
      const file = normalize(join(ROOT, path))
      if (!file.startsWith(ROOT)) return void res.writeHead(403).end()
      let body: Buffer
      try {
        body = readFileSync(file)
      } catch {
        return void res.writeHead(404).end()
      }
      res.writeHead(200, {
        "content-type": TYPES[extname(file)] ?? "application/octet-stream",
        "content-length": body.length,
        "accept-ranges": "none",
      })
      res.end(body)
    })
    return new Promise((done) => this.server!.listen(MEDIA_PORT, "127.0.0.1", done))
  }

  stop(): Promise<void> {
    return new Promise((done) => (this.server ? this.server.close(() => done()) : done()))
  }
}
