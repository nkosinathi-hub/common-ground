# 0004. Money in integer minor units; dates without time as date-only values

- Status: accepted
- Date: 2026-10-15

## Context

Budgets add, subtract and compare amounts; floating point drifts. Due dates and milestones are
calendar days, and timestamps shift them across time zones (the export stored them as text).

## Decision

- Money is an integer count of minor units plus one ISO 4217 currency per idea (`ZAR` default),
  modelled by `Money` in `src/shared/domain`. Columns are `bigint` named `*_minor`; the currency
  is a three-letter code on the idea.
- Changing an idea's currency is refused while budget entries exist, unless the caller
  explicitly asks to clear them (`change_idea_currency`).
- Calendar dates are `DateOnly` strings `YYYY-MM-DD` in TypeScript and `date` in Postgres.
- Instants (`created_at`, `updated_at`) stay `timestamptz`.

## Consequences

- Totals and variance are exact; formatting happens only at the UI edge with `Intl`.
- No time-zone bugs on due dates; comparisons are string or `date` comparisons.
