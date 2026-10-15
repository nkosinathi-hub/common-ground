import { stack } from "./stack"

const base = () => stack().MAILPIT_URL ?? stack().INBUCKET_URL ?? "http://127.0.0.1:54324"

interface Summary {
  ID: string
}

/** Waits for the newest email to an address and returns the first auth link in it. */
export async function latestLink(to: string, timeoutMs = 20_000): Promise<string> {
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    const search = await fetch(`${base()}/api/v1/search?query=${encodeURIComponent(`to:${to}`)}`)
    const { messages } = (await search.json()) as { messages: Summary[] }
    if (messages.length > 0) {
      const message = await fetch(`${base()}/api/v1/message/${messages[0]!.ID}`)
      const { HTML, Text } = (await message.json()) as { HTML: string; Text: string }
      const link = /https?:\/\/[^\s"'<>]+\/auth\/v1\/verify[^\s"'<>]+/.exec(HTML || Text)?.[0]
      if (link) return link.replaceAll("&amp;", "&")
    }
    await new Promise((resolve) => setTimeout(resolve, 500))
  }
  throw new Error(`No auth email for ${to}`)
}
