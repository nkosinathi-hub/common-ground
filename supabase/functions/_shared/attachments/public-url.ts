/**
 * Signed URLs carry the origin the function reached Storage through. Hosted, that is the public
 * project URL; locally it is the internal gateway (http://kong:8000), which a browser cannot
 * reach, so PUBLIC_API_URL names the origin to hand out instead. Empty means unchanged.
 */
export function toPublicUrl(signed: string, publicOrigin: string): string {
  if (!publicOrigin) return signed
  const url = new URL(signed)
  const origin = new URL(publicOrigin)
  url.protocol = origin.protocol
  url.host = origin.host
  return url.toString()
}
