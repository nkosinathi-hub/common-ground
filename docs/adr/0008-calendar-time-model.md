# 0008. Calendar time model: instants for timed events, dates for all-day; window paging

- Status: accepted
- Date: 2026-10-16

## Context

The v0.2 calendar holds timed events, all-day events, yearly occasions (birthdays,
anniversaries), task due dates and milestones. Members may sit in different time zones and
travel, and DST moves wall-clock offsets. An all-day event must never shift to the day before or
after. ADR 0005's keyset paging fits lists ordered by creation, not a calendar that is read by
date range.

## Decision

- **Timed events are instants.** `starts_at` and `ends_at` are `timestamptz`, at most 14 days
  apart. Each viewer sees them in their own zone.
- **All-day events are dates.** `start_date` and `end_date` are `date` (inclusive, at most 31
  days), like `DateOnly` in ADR 0004. They show on the same days for everyone.
- **`time_zone` is an IANA name** (checked against `pg_timezone_names`; abbreviations such as
  `EST` and POSIX strings are rejected). It is the zone the event was planned in, used for
  display and as the reminder anchor of all-day events: 09:00 local on the start date.
- **Yearly occasions** are one-day all-day events with `repeats_yearly`. An occurrence is the
  start date plus whole years, so 29 February falls on 28 February in other years. Recurrence
  rules beyond yearly are out of scope for v0.2.
- **Reminders** store a precomputed `remind_at`. A pg_cron job (`calendar-reminders`, every
  minute) delivers due reminders once, retires any more than an hour late, skips people who
  declined and moves yearly reminders to the next occurrence. Moving an event recomputes them.
- **Window paging.** `list_calendar(space, from_date, to_date, tz)` returns one window of local
  days (at most 92) instead of keyset pages: timed events overlapping it, all-day events
  overlapping it, yearly occurrences, task due dates and milestone target dates, ordered by
  start. It returns at most 1000 rows; a full result means the client should narrow the window.

## Consequences

- No DST or zone drift: instants are stored once, dates never convert.
- Month and agenda views fetch one window per screen; there is no cursor to keep.
- Every timed event must have an end; open-ended events are not modelled.
- Hosted Supabase needs pg_cron enabled; scheduling by job name is idempotent.
