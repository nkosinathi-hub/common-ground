/** The currencies the picker offers first; any ISO 4217 code is accepted. */
export const CURRENCIES = [
  "ZAR",
  "USD",
  "EUR",
  "GBP",
  "BWP",
  "NAD",
  "KES",
  "NGN",
  "AUD",
  "CAD",
] as const

/** The picker's choices: the common currencies, led by the idea's own when it is not one. */
export function currencyOptions(current: string): string[] {
  const common: string[] = [...CURRENCIES]
  return common.includes(current) ? common : [current, ...common]
}
