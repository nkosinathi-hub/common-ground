import { AccountService, provideAccount, SupabaseAccountRepository } from "@/features/account"
import { AuthService, SessionStore, provideAuth } from "@/features/auth"
import { SupabaseAuthGateway } from "@/features/auth/infrastructure/supabase-auth-gateway"
import { NotificationsStore, provideNotifications } from "@/features/notifications"
import {
  SupabaseActivity,
  SupabaseNotifications,
} from "@/features/notifications/infrastructure/supabase-notifications"
import { CatalogService, SupabaseCatalogGateway, setCatalogService } from "@/features/catalog"
import { SpacesService, SpacesStore, provideSpaces } from "@/features/spaces"
import { LocalActiveSpace } from "@/features/spaces/infrastructure/local-active-space"
import { SupabaseSpacesGateway } from "@/features/spaces/infrastructure/supabase-spaces-gateway"
import type { Db } from "@/shared/infrastructure/supabase"

export function composeCore(db: Db) {
  const basePath = import.meta.env.BASE_URL
  const appUrl = `${window.location.origin}${basePath}`
  const auth = new AuthService(new SupabaseAuthGateway(db), {
    origin: window.location.origin,
    basePath,
  })
  const session = new SessionStore(auth)
  const spaces = new SpacesService(
    new SupabaseSpacesGateway(db),
    new LocalActiveSpace(),
    auth,
    appUrl,
  )
  const spacesStore = new SpacesStore(spaces)
  const catalog = new CatalogService(new SupabaseCatalogGateway(db))
  const notifications = new NotificationsStore(new SupabaseNotifications(db))
  const activity = new SupabaseActivity(db)
  const account = new AccountService(new SupabaseAccountRepository(db), auth)
  return { db, auth, account, session, spaces, spacesStore, catalog, notifications, activity }
}

export function provideCore(services: ReturnType<typeof composeCore>): void {
  provideAuth({ service: services.auth, session: services.session })
  provideAccount({ service: services.account })
  provideSpaces({ service: services.spaces, store: services.spacesStore })
  setCatalogService(services.catalog)
  provideNotifications({ store: services.notifications, activity: services.activity })
}
