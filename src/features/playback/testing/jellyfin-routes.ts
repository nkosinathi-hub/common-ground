import { json, type Handler } from "./fixture-server"
import { playbackInfo, segments, TICKS, TOKEN } from "./jellyfin-media"

export { TOKEN }

const authed =
  (handler: Handler): Handler =>
  (req, res, body) =>
    String(req.headers.authorization ?? "").includes(`Token="${TOKEN}"`)
      ? handler(req, res, body)
      : json(res, {}, 401)

const episode = (Id: string, s: number, e: number, tmdb: string, end?: number) => ({
  ...{ Id, Type: "Episode", ParentIndexNumber: s, IndexNumber: e, ProviderIds: { Tmdb: tmdb } },
  ...(end ? { IndexNumberEnd: end } : {}),
  UserData: { PlaybackPositionTicks: 0 },
})

const LIBRARY = [
  {
    Id: "m1",
    Type: "Movie",
    ProviderIds: { Tmdb: "603" },
    UserData: { PlaybackPositionTicks: 42 * TICKS },
  },
  { Id: "s1", Type: "Series", ProviderIds: { Tmdb: "1399" } },
  { Id: "x1", Type: "Movie", ProviderIds: { Imdb: "tt1" } },
]

const EPISODES = [
  episode("e1", 1, 1, "63056"),
  episode("e2", 1, 2, "63057", 3),
  episode("e9", 2, 5, "777"),
]
/** A Jellyfin 12 stand-in: a small library, PlaybackInfo, segments, sessions and sign-in. */
export const jellyfinRoutes: Record<string, Handler> = {
  "/System/Info/Public": (_req, res) => json(res, { Version: "12.2.0" }),
  "/Items": authed((_req, res) => json(res, { Items: LIBRARY })),
  "/Shows/s1/Episodes": authed((_req, res) => json(res, { Items: EPISODES })),
  "/Shows/NextUp": authed((_req, res) => json(res, { Items: [{ ...EPISODES[1], Name: "Two" }] })),
  "POST /Items/m1/PlaybackInfo": authed(playbackInfo),
  "POST /Items/e1/PlaybackInfo": authed(playbackInfo),
  "POST /Items/e2/PlaybackInfo": authed(playbackInfo),
  "POST /Items/e9/PlaybackInfo": authed(playbackInfo),
  "/MediaSegments/m1": authed(segments),
  "/MediaSegments/e1": authed(segments),
  "POST /Sessions/Playing": authed((_req, res) => json(res, {}, 204)),
  "POST /Sessions/Playing/Progress": authed((_req, res) => json(res, {}, 204)),
  "POST /Sessions/Playing/Stopped": authed((_req, res) => json(res, {}, 204)),
  "POST /Sessions/Logout": authed((_req, res) => json(res, {}, 204)),
  "POST /Users/AuthenticateByName": (_req, res, body) =>
    (JSON.parse(body) as { Pw?: string }).Pw === "right"
      ? json(res, { AccessToken: TOKEN, User: { Id: "u1" } })
      : json(res, {}, 401),
}
