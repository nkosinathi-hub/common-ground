import { getContext, setContext } from "svelte"
import type { AttachmentsService } from "../application/attachments-service"

const KEY = Symbol("attachments")

export interface AttachmentsContext {
  readonly service: AttachmentsService
}

/** Called once by the composition root (src/app/composition). */
export function provideAttachments(value: AttachmentsContext): void {
  setContext(KEY, value)
}

export function useAttachments(): AttachmentsContext {
  const value = getContext<AttachmentsContext | undefined>(KEY)
  if (!value) throw new Error("Attachments are not provided: call provideAttachments")
  return value
}
