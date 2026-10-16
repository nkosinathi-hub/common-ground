import { AccountService, provideAccount } from "@/features/account"
import { SupabaseAccountRepository } from "@/features/account/infrastructure/supabase-account-repository"
import { AuthService, SessionStore, provideAuth } from "@/features/auth"
import { SupabaseAuthGateway } from "@/features/auth/infrastructure/supabase-auth-gateway"
import {
  NotificationsService,
  NotificationsStore,
  provideNotifications,
} from "@/features/notifications"
import {
  SupabaseActivity,
  SupabaseNotifications,
} from "@/features/notifications/infrastructure/supabase-notifications"
import { CatalogService, provideCatalog } from "@/features/catalog"
import { SupabaseCatalogGateway } from "@/features/catalog/infrastructure/supabase-catalog-gateway"
import { SpacesService, SpacesStore, provideSpaces } from "@/features/spaces"
import { LocalActiveSpace } from "@/features/spaces/infrastructure/local-active-space"
import { SupabaseSpacesGateway } from "@/features/spaces/infrastructure/supabase-spaces-gateway"
import type { Db } from "@/shared/infrastructure/supabase"

const clock = () => new Date()

export function composeCore(db: Db) {
  const basePath = import.meta.env.BASE_URL
  const appUrl = `${window.location.origin}${basePath}`
  const auth = new AuthService(new SupabaseAuthGateway(db), {
    origin: window.location.origin,
    basePath,
  })
  const session = new SessionStore(auth)
  const spaces = new SpacesService({
    gateway: new SupabaseSpacesGateway(db),
    active: new LocalActiveSpace(),
    auth,
    appUrl,
    clock,
  })
  const spacesStore = new SpacesStore(spaces)
  const catalog = new CatalogService(new SupabaseCatalogGateway(db))
  const inbox = new NotificationsService(
    new SupabaseNotifications(db),
    new SupabaseActivity(db),
    clock,
  )
  const notifications = new NotificationsStore(inbox)
  const account = new AccountService(new SupabaseAccountRepository(db), auth)
  return { db, auth, account, session, spaces, spacesStore, catalog, inbox, notifications }
}

export function provideCore(services: ReturnType<typeof composeCore>): void {
  provideAuth({ service: services.auth, session: services.session })
  provideAccount({ service: services.account })
  provideSpaces({ service: services.spaces, store: services.spacesStore })
  provideCatalog({ service: services.catalog })
  provideNotifications({ service: services.inbox, store: services.notifications })
}
