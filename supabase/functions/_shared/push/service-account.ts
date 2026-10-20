/** The fields of a Google service-account key file that sending through FCM needs. */
export interface ServiceAccount {
  readonly projectId: string
  readonly clientEmail: string
  readonly privateKey: string
  readonly tokenUri: string
}

const TOKEN_URI = "https://oauth2.googleapis.com/token"

const text = (value: unknown): string | null =>
  typeof value === "string" && value.length > 0 ? value : null

/** Reads FCM_SERVICE_ACCOUNT (the key file as base64 JSON), or null when it is unusable. */
export function parseServiceAccount(base64: string): ServiceAccount | null {
  let raw: Record<string, unknown>
  try {
    raw = JSON.parse(
      new TextDecoder().decode(Uint8Array.from(atob(base64), (c) => c.charCodeAt(0))),
    ) as Record<string, unknown>
  } catch {
    return null
  }
  const projectId = text(raw?.project_id)
  const clientEmail = text(raw?.client_email)
  const privateKey = text(raw?.private_key)
  if (!projectId || !clientEmail || !privateKey) return null
  return { projectId, clientEmail, privateKey, tokenUri: text(raw.token_uri) ?? TOKEN_URI }
}
