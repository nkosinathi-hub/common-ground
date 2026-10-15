import { AuthService, SessionStore, provideAuth } from "@/features/auth"
import { SupabaseAuthGateway } from "@/features/auth/infrastructure/supabase-auth-gateway"
import { CatalogService, SupabaseCatalogGateway, setCatalogService } from "@/features/catalog"
import { SpacesService, SpacesStore, provideSpaces } from "@/features/spaces"
import { LocalActiveSpace } from "@/features/spaces/infrastructure/local-active-space"
import { SupabaseSpacesGateway } from "@/features/spaces/infrastructure/supabase-spaces-gateway"
import { createSupabase, type Db } from "@/shared/infrastructure/supabase"

/** The only place adapters are constructed. Features receive services through context. */
export function compose(db: Db = createSupabase()) {
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
  return { db, auth, session, spaces, spacesStore, catalog }
}

export type Services = ReturnType<typeof compose>

export function provideServices(services: Services): void {
  provideAuth({ service: services.auth, session: services.session })
  provideSpaces({ service: services.spaces, store: services.spacesStore })
  setCatalogService(services.catalog)
}
