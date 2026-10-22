import { createSupabase, type Db } from "@/shared/infrastructure/supabase"
import { chromeStorage, local } from "./chrome-storage"

/**
 * A Common Ground client for the popup or a netflix.com tab: the build's Supabase origin and anon
 * key, the session in chrome.storage.local, and the Realtime heartbeat on the page (no worker).
 */
export const extensionDb = (): Db =>
  createSupabase(undefined, undefined, chromeStorage(local()), false)
