import { appError, err, ok } from "@/shared/domain"
import { FakeMemberDirectory } from "@/shared/domain/testing/fake-members"
import { WatchService } from "../application/watch-service"
import { ME, PARTNER } from "./fixtures"
import { FakeWatchGateway } from "./fake-watch-gateway"

/** The fakes behind a rendered watch component; tests provide them with provideWatch. */
export function watchFakes() {
  const gateway = new FakeWatchGateway()
  const members = new FakeMemberDirectory([
    { id: ME, displayName: "Nkosi" },
    { id: PARTNER, displayName: "Lindi" },
  ])
  const service = new WatchService(gateway)
  return { gateway, members, service }
}

/** A catalog that finds nothing and has no listings; enough for watch UI tests. */
export const emptyCatalogGateway = {
  search: async () =>
    ok({ results: [], page: 1, totalPages: 0, checkedAt: "2026-10-15T10:00:00Z", stale: false }),
  details: async () => err(appError("not_found", "No listings for this title")),
  refresh: async () => err(appError("not_found", "No listings for this title")),
}
