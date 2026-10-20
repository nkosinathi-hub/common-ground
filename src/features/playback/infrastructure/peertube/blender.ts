import type { PeerTubeInstance } from "./plugin"
import type { PeerTubeTitle } from "./titles"

/** The Blender Foundation's own PeerTube instance, where it publishes its open movies. */
export const BLENDER_INSTANCE: PeerTubeInstance = { origin: "https://video.blender.org" }

const CC_BY_3 = "https://creativecommons.org/licenses/by/3.0/"

/**
 * Blender open movies, by TMDB id. The Foundation releases them under Creative Commons
 * Attribution; `licence` is set where the instance leaves its licence field empty, and the
 * credits inside each film carry the attribution the licence asks for.
 */
export const BLENDER_TITLES: readonly PeerTubeTitle[] = [
  // Big Buck Bunny (2008); the instance states CC BY.
  { tmdbId: 10378, video: "6402b77c-b61f-4a06-96ca-c8420a2becf4" },
  // Sintel (2010)
  { tmdbId: 45745, video: "0eb052d0-fd51-43e6-aa33-ecdbf77a5d40", licence: CC_BY_3 },
  // Tears of Steel (2012)
  { tmdbId: 133701, video: "8533ea43-4271-4a57-9694-e9d0b35e1aa1", licence: CC_BY_3 },
  // Cosmos Laundromat (2015); the instance states CC BY.
  { tmdbId: 358332, video: "f507dfdc-e73e-45a4-9778-d758cbe1ce96" },
]
