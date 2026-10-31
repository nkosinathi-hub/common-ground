import { appError, err, ok } from "@/shared/domain"
import { FakeMemberDirectory } from "@/shared/domain/testing/fake-members"
import { WatchOpinions } from "../application/watch-opinions"
import { WatchService } from "../application/watch-service"
import { FakeWatchOpinions } from "./fake-watch-opinions"
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
  const opinionRows = new FakeWatchOpinions()
  const opinions = new WatchOpinions(opinionRows)
  /** Everything provideWatch takes; one series season of six episodes. */
  const context = {
    service,
    members,
    authors: members,
    opinions,
    seasons: async () => ok([{ number: 1, episodeCount: 6 }]),
  }
  return { gateway, members, service, opinionRows, context }
}

/** A catalog that finds nothing and has no listings; enough for watch UI tests. */
export const emptyCatalogGateway = {
  search: async () =>
    ok({ results: [], page: 1, totalPages: 0, checkedAt: "2026-10-15T10:00:00Z", stale: false }),
  details: async () => err(appError("not_found", "No listings for this title")),
  refresh: async () => err(appError("not_found", "No listings for this title")),
  season: async () => err(appError("not_found", "No such season")),
}
