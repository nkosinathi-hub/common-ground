import { safeWatchLink } from "./links.ts"
import type { Availability, ProviderCategory, ProviderCategoryKey, Region } from "./types.ts"

const HOME_REGION = "ZA"

const CATEGORIES: readonly { key: ProviderCategoryKey; label: string }[] = [
  { key: "flatrate", label: "Subscription" },
  { key: "free", label: "Free" },
  { key: "ads", label: "With ads" },
  { key: "rent", label: "Rent" },
  { key: "buy", label: "Buy" },
]

type RawRegion = Record<string, unknown>

const regionNames = new Intl.DisplayNames(["en"], { type: "region" })

function providerNames(entries: unknown): string[] {
  if (!Array.isArray(entries)) return []
  const names = entries
    .map((entry: { provider_name?: unknown } | null) => entry?.provider_name)
    .filter((name): name is string => typeof name === "string" && name.length > 0)
  return [...new Set(names)]
}

function toRegion(code: string, raw: RawRegion): Region {
  const categories: ProviderCategory[] = CATEGORIES.map((category) => ({
    ...category,
    providers: providerNames(raw[category.key]),
  })).filter((category) => category.providers.length > 0)
  return { code, name: regionNames.of(code) ?? code, link: safeWatchLink(raw.link), categories }
}

/** Groups TMDB watch/providers results: ZA first, else other countries flagged as fallback. */
export function groupProviders(results: unknown): Availability {
  const entries = Object.entries((results ?? {}) as Record<string, unknown>)
  const regions = entries
    .filter(([code, raw]) => /^[A-Z]{2}$/.test(code) && typeof raw === "object" && raw !== null)
    .map(([code, raw]) => toRegion(code, raw as RawRegion))
    .filter((region) => region.categories.length > 0)
  const home = regions.find((region) => region.code === HOME_REGION)
  const others = regions
    .filter((region) => region.code !== HOME_REGION)
    .sort((a, b) => a.name.localeCompare(b.name, "en"))
  return { regions: home ? [home, ...others] : others, fallback: !home }
}
