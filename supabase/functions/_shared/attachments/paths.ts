export const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export const isUuid = (value: unknown): value is string =>
  typeof value === "string" && UUID.test(value)

export interface ObjectPath {
  readonly spaceId: string
  readonly ideaId: string
  readonly uploadId: string
}

/** `<space_id>/<idea_id>/<upload_id>`, matching the generated column public.attachments.object_path. */
export function buildObjectPath({ spaceId, ideaId, uploadId }: ObjectPath): string {
  if (![spaceId, ideaId, uploadId].every(isUuid)) throw new Error("object path parts must be uuids")
  return `${spaceId}/${ideaId}/${uploadId}`.toLowerCase()
}

export function parseObjectPath(path: string): ObjectPath | null {
  const parts = path.split("/")
  if (parts.length !== 3 || !parts.every(isUuid)) return null
  const [spaceId, ideaId, uploadId] = parts.map((part) => part.toLowerCase()) as [
    string,
    string,
    string,
  ]
  return { spaceId, ideaId, uploadId }
}
