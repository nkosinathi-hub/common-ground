import { deviceStore } from "@/shared/ui"

const KEY = "pending-invite"

/** An invite opened while signed out is resumed after sign-in. Session-scoped only. */
export const pendingInvite = {
  read: (): string | null => deviceStore("session").read(KEY),
  write: (token: string | null) => deviceStore("session").write(KEY, token),
}
