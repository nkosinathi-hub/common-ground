// Test helpers: a throwaway RSA key in a service-account shape, never a real credential.
import type { ServiceAccount } from "./service-account.ts"

const RSA = {
  name: "RSASSA-PKCS1-v1_5",
  modulusLength: 2048,
  publicExponent: new Uint8Array([1, 0, 1]),
  hash: "SHA-256",
}

const toPem = (der: ArrayBuffer) => {
  const base64 = btoa(String.fromCharCode(...new Uint8Array(der)))
  const lines = base64.match(/.{1,64}/g)?.join("\n") ?? ""
  return `-----BEGIN PRIVATE KEY-----\n${lines}\n-----END PRIVATE KEY-----\n`
}

export async function sampleAccount(): Promise<{ account: ServiceAccount; publicKey: CryptoKey }> {
  const pair = await crypto.subtle.generateKey(RSA, true, ["sign", "verify"])
  const der = await crypto.subtle.exportKey("pkcs8", pair.privateKey)
  const account: ServiceAccount = {
    projectId: "common-ground-test",
    clientEmail: "push@common-ground-test.iam.gserviceaccount.com",
    privateKey: toPem(der),
    tokenUri: "https://oauth2.googleapis.com/token",
  }
  return { account, publicKey: pair.publicKey }
}

/** The base64 secret FCM_SERVICE_ACCOUNT holds, in Google's JSON key file shape. */
export const encodeAccount = (account: ServiceAccount): string =>
  btoa(
    JSON.stringify({
      type: "service_account",
      project_id: account.projectId,
      client_email: account.clientEmail,
      private_key: account.privateKey,
      token_uri: account.tokenUri,
    }),
  )

export const fromBase64Url = (part: string): Uint8Array =>
  Uint8Array.from(atob(part.replace(/-/g, "+").replace(/_/g, "/")), (c) => c.charCodeAt(0))
