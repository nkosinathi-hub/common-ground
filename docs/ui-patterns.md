# UI patterns

How feature UI loads, reloads and shows data. [Conventions](CONVENTIONS.md) has the layout and layers.

## Lists and loads

- A keyset-paged list is a `PagedList` (shared/ui) rendered with `LoadMore`; an unpaged value is a
  `Resource` rendered with `AsyncView`. Do not hand-roll another paged list: `PagedList` already
  ignores superseded responses and refuses a second "load more" while one is running.
- Both run their loader untracked, so an `$effect` that calls `load()` depends on nothing by itself.
  Reload on a change with one idiom: name the dependencies, then load untracked.

  ```ts
  $effect(() => {
    void [spaceId, filter]
    untrack(() => list.load())
  })
  ```

  An effect with no dependencies loads once on mount. A change of space, idea or item remounts the
  page (`{#key}` in src/app), so components do not reload for those.

## Dates and numbers

- One locale, `LOCALE` (en-ZA) in shared/domain. Show an instant with `formatDateTime` or `formatDay`
  (viewer's time zone), a `DateOnly` with `formatDateOnly` (never shifts), money with `formatMoney`.
  Never call `toLocaleString` or `Intl` in a component.
