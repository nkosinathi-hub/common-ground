import { appError, err, ok } from "@/shared/domain"
import { WatchService } from "../application/watch-service"
import { FakeMemberDirectory } from "./fake-members"
import { FakeWatchGateway } from "./fake-watch-gateway"

/** The fakes behind a rendered watch component; tests provide them with provideWatch. */
export function watchFakes() {
  const gateway = new FakeWatchGateway()
  const members = new FakeMemberDirectory()
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
