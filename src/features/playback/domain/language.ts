const ALIASES: Record<string, string> = {
  eng: "en",
  english: "en",
  spa: "es",
  spanish: "es",
  esp: "es",
  castellano: "es",
  ita: "it",
  italian: "it",
  fra: "fr",
  fre: "fr",
  french: "fr",
  deu: "de",
  ger: "de",
  por: "pt",
  jpn: "ja",
  kor: "ko",
  original: "und",
  unknown: "und",
}

export function languageCode(value: string): string {
  const code = value.trim().toLowerCase().replaceAll("_", "-")
  return ALIASES[code] ?? code.split("-")[0] ?? "und"
}

/** An explicit match beats unknown audio, which beats a known different dub. */
export function audioRank(languages: readonly string[] = [], preferred = "en"): number {
  const codes = languages.map(languageCode)
  if (codes.includes(languageCode(preferred))) return 0
  return !codes.length || codes.includes("und") ? 1 : 2
}
