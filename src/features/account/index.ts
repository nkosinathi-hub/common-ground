export { AccountService, type ExportFile, type SpaceRef } from "./application/account-service"
export type { AccountRepository, Reauthenticator } from "./application/ports"
export {
  authorLabel,
  CONFIRM_WORD,
  exportFilename,
  FORMER_MEMBER,
  validateConfirmation,
  validateDisplayName,
} from "./domain/account"
export { SupabaseAccountRepository } from "./infrastructure/supabase-account-repository"
export { provideAccount, useAccount, type AccountContext } from "./ui/context"
export { downloadFile } from "./ui/download"
export { default as DataExportCard } from "./ui/DataExportCard.svelte"
export { default as DeleteAccountCard } from "./ui/DeleteAccountCard.svelte"
export { default as PasswordCard } from "./ui/PasswordCard.svelte"
export { default as ProfileCard } from "./ui/ProfileCard.svelte"
