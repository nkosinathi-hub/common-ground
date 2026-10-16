import { LOCALE } from "./format"
import { appError, err, ok, type Result } from "./result"

export interface Money {
  readonly minor: number
  readonly currency: string
}

export const money = (minor: number, currency: string): Money => ({ minor, currency })
export const isCurrencyCode = (code: string): boolean => /^[A-Z]{3}$/.test(code)

const AMOUNT = /^(\d{1,12})(?:[.,](\d{1,2}))?$/

export function parseMoney(input: string, currency: string): Result<Money> {
  const compact = input.replace(/[\s\u00a0]/g, "")
  const match = AMOUNT.exec(compact)
  if (!match) return err(appError("validation", "Enter a positive amount with up to 2 decimals"))
  const whole = Number(match[1])
  const cents = Number((match[2] ?? "0").padEnd(2, "0"))
  return ok(money(whole * 100 + cents, currency))
}

function same(a: Money, b: Money): void {
  if (a.currency !== b.currency) throw new Error("Cannot combine amounts in different currency")
}

export function addMoney(a: Money, b: Money): Money {
  same(a, b)
  return money(a.minor + b.minor, a.currency)
}

export function subtractMoney(a: Money, b: Money): Money {
  same(a, b)
  return money(a.minor - b.minor, a.currency)
}

export function formatMoney(value: Money, locale = LOCALE): string {
  return new Intl.NumberFormat(locale, { style: "currency", currency: value.currency }).format(
    value.minor / 100,
  )
}
