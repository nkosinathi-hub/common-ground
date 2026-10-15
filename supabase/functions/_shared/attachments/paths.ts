import { isUuid } from "../http/request.ts"

interface ObjectPath {
  readonly spaceId: string
  readonly ideaId: string
  readonly uploadId: string
}

/** `<space_id>/<idea_id>/<upload_id>`, matching the generated column public.attachments.object_path. */
export function buildObjectPath({ spaceId, ideaId, uploadId }: ObjectPath): string {
  if (![spaceId, ideaId, uploadId].every(isUuid)) throw new Error("object path parts must be uuids")
  return `${spaceId}/${ideaId}/${uploadId}`.toLowerCase()
}
