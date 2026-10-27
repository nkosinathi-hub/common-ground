const origin = process.env.VITE_CINEPRO_CORE_ORIGIN
if (!origin) throw new Error("VITE_CINEPRO_CORE_ORIGIN is required")

const core = new URL(origin)
if (core.protocol !== "https:") throw new Error("CinePro public origin must use HTTPS")

const started = Date.now()
const response = await fetch(`${core.origin}/v1/tv/1396/seasons/1/episodes/1`, {
  headers: { Accept: "application/json", Origin: "https://nkosinathi-hub.github.io" },
  signal: AbortSignal.timeout(90_000),
})
if (!response.ok) throw new Error(`Public CinePro returned HTTP ${response.status}`)

const cors = response.headers.get("access-control-allow-origin")
if (cors !== "*" && cors !== "https://nkosinathi-hub.github.io")
  throw new Error("Public CinePro did not allow the website origin")

const payload = await response.json()
const sources = (Array.isArray(payload.sources) ? payload.sources : []).filter((source) => {
  try {
    const url = new URL(source.url)
    return url.origin === core.origin && url.pathname.startsWith("/v1/proxy")
  } catch {
    return false
  }
})
const elapsed = Date.now() - started
if (!sources.length) throw new Error("Public CinePro returned no proxied episode sources")
if (elapsed >= 60_000) throw new Error(`CinePro took ${elapsed}ms; mobile lookup budget is 60s`)

// Check that a phone can reach actual media through the same public origin as the API.
// Limit the read and never print signed proxy URLs, which contain upstream access tokens.
let mediaBytes = 0
for (const source of sources.slice(0, 3)) {
  try {
    const media = await fetch(source.url, {
      headers: { Origin: "https://nkosinathi-hub.github.io", Range: "bytes=0-1023" },
      signal: AbortSignal.timeout(15_000),
    })
    if (!media.ok) continue
    const reader = media.body?.getReader()
    if (!reader) continue
    const chunk = await reader.read()
    mediaBytes = chunk.value?.byteLength ?? 0
    await reader.cancel()
    if (mediaBytes > 0) break
  } catch {
    // Try another provider result. Error messages can include its signed source URL.
  }
}
if (!mediaBytes) throw new Error("Public CinePro sources returned no readable media bytes")

console.log(
  `Off-tailnet CinePro smoke passed: ${sources.length} sources and ${mediaBytes} media bytes in ${elapsed}ms`,
)
