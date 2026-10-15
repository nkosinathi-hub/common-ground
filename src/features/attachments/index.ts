export type { Attachment, AttachmentKind, AttachmentMime, UploadProgress } from "./domain/types"
export { ACCEPT, MAX_BYTES, canDelete, formatBytes, kindOf, precheckFile } from "./domain/rules"
export type {
  AttachmentsGateway,
  Disposition,
  ObjectUploader,
  PutOptions,
  StartRequest,
  StartedUpload,
} from "./application/ports"
export { AttachmentsService, CANCELLED_MESSAGE } from "./application/attachments-service"
export { ATTACHMENTS_CONTEXT, provideAttachments, useAttachments } from "./ui/context"
export { default as AttachmentsPanel } from "./ui/AttachmentsPanel.svelte"
