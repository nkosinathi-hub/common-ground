// The OAuth 2.0 JWT bearer assertion Google exchanges for an access token, signed with WebCrypto
// (RS256), so no dependency is needed. The key never leaves this module and is never logged.
import type { ServiceAccount } from "./service-account.ts"

export const FCM_SCOPE = "https://www.googleapis.com/auth/firebase.messaging"
const LIFETIME_SECONDS = 3600
const RS256 = { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }

const base64Url = (bytes: Uint8Array): string => {
  let binary = ""
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "")
}

const encodeJson = (value: unknown) => base64Url(new TextEncoder().encode(JSON.stringify(value)))

function pemBody(pem: string): Uint8Array {
  const base64 = pem.replace(/-----(BEGIN|END) PRIVATE KEY-----/g, "").replace(/\s+/g, "")
  return Uint8Array.from(atob(base64), (c) => c.charCodeAt(0))
}

const importKey = (pem: string) =>
  crypto.subtle.importKey("pkcs8", pemBody(pem).buffer as ArrayBuffer, RS256, false, ["sign"])

/** A signed assertion for the FCM scope, issued at `nowSeconds` and valid for an hour. */
export async function signAssertion(account: ServiceAccount, nowSeconds: number): Promise<string> {
  const header = encodeJson({ alg: "RS256", typ: "JWT" })
  const claims = encodeJson({
    iss: account.clientEmail,
    scope: FCM_SCOPE,
    aud: account.tokenUri,
    iat: nowSeconds,
    exp: nowSeconds + LIFETIME_SECONDS,
  })
  const input = new TextEncoder().encode(`${header}.${claims}`)
  const signature = await crypto.subtle.sign(RS256, await importKey(account.privateKey), input)
  return `${header}.${claims}.${base64Url(new Uint8Array(signature))}`
}
