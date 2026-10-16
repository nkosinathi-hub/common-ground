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
- A test about local days pins `process.env.TZ` to a zone far from UTC (America/Los_Angeles) in
  `beforeEach`, uses a UTC instant near midnight, and restores TZ in `afterEach`.

## Contexts and stores

- A feature context is `provideX({ service, ... })` from the composition root and `useX()`, which
  throws when nothing was provided. Component tests render through `Provided` (shared/ui/testing).
- Rune stores live in `*.svelte.ts` files named after their class: an app-wide store is
  `XStore` in `x-store.svelte.ts` (one per app, provided by composition); a component-scoped
  state is `XState` in `x-state.svelte.ts` (created by the component that owns it).

## Navigation

- Links use `href={buildHash(route)}`; never write a `"#/..."` string by hand.
- Code that moves on after an action calls `navigate(route)` from shared/ui (or passes a hash a
  parent built). Never set `location.hash` or call `location.assign` in a component; the hash
  router follows `hashchange`, so history and back keep working.

## Naming people

- Pickers (mentions, assignees, recipients, invites, who was there) offer current members only:
  `MemberDirectory`.
- Attribution names people through `AuthorDirectory` (composition's `authorDirectory`): a
  current member by name, someone who left or was removed by their profile name while the viewer
  can still see it (they share another space), otherwise `FORMER_MEMBER`. A deleted account is
  always "Former member". Server-joined names (recommendations, notifications, activity) follow
  the same rule because profiles RLS decides what the join returns.
