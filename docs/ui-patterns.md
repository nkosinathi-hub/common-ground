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
    untrack(() => void list.load())
  })
  ```

  `load()` never rejects (a loader that throws ends in an "unknown" error), so `void` marks the
  call as fire-and-forget; lint (`no-floating-promises`) requires it.

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

## Dialogs, phones and classes

- Every dialog is `DialogShell` (shared/ui): title, description, Close, then optional `header`
  (tabs or a segmented control), `status` (beside Close, e.g. `AutosaveStatus`), the body, and a
  footer of Cancel then one primary. `footerStart` holds a destructive action ("Delete event…");
  `footer` replaces the footer for steps (Back, Next) or a credit line. Below 640 px it is a
  bottom sheet. A dialog about a title starts with the catalog's `TitleSummary`.
- On phones each screen that creates something has one `Fab` above the tab bar; add forms that
  sit open on desktop wait behind `PhoneAdd` ("+ Add note") so the content keeps the height.
- `cn` knows the generated `type-*` text styles and the `container/*` widths, so a later
  `type-h2` or `max-w-dialog-wide` replaces a component's own `text-lg` or `max-w-lg`. A label's
  "(optional)" comes from `FormField optional`, never typed into the label.
