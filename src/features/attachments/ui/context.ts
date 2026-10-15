import { getContext, setContext } from "svelte"
import type { AttachmentsService } from "../application/attachments-service"

const KEY = Symbol("attachments")

export const ATTACHMENTS_CONTEXT = KEY

export const provideAttachments = (service: AttachmentsService) => setContext(KEY, service)

export function useAttachments(): AttachmentsService {
  const service = getContext<AttachmentsService | undefined>(KEY)
  if (!service)
    throw new Error("AttachmentsService is not provided: call provideAttachments in composition")
  return service
}
