# Figma components and their code

Every component in the Figma section "04 Components" (`175:23`) maps to exactly one code
component. Screens use these, never a copy. Where a component belongs to one feature, it lives in
that feature's `ui` folder and is built with the screen issue named.

## Icons

`icon/*` components are `@lucide/svelte` icons of the same name, for example `icon/square-pen`
is `SquarePen` and `icon/lock-keyhole` is `LockKeyhole`. No other icon source is used.

## Primitives (`src/lib/components/ui`)

| Figma                      | Id                     | Code                                                                                                            |
| -------------------------- | ---------------------- | --------------------------------------------------------------------------------------------------------------- |
| Button                     | `176:155`              | `button` (variants default, secondary, outline, ghost, destructive, link; sizes sm, default, lg, icon, icon-sm) |
| Badge                      | `177:18`               | `badge`                                                                                                         |
| Card                       | `177:19`               | `card`                                                                                                          |
| Input field                | `177:45`               | `input`, `textarea`, inside `FormField`                                                                         |
| Avatar                     | `198:2428`             | `avatar` (tone secondary or brand)                                                                              |
| Checkbox                   | `198:2449`             | `checkbox`                                                                                                      |
| Switch                     | `198:2458`             | `switch`                                                                                                        |
| Progress bar               | `198:2498`             | `progress`                                                                                                      |
| Select                     | `199:2440`             | `native-select` (the device picker stays native on phones)                                                      |
| Callout                    | `199:2500`             | `alert` (default is muted, plus secondary)                                                                      |
| Segment, Segmented control | `199:2509`, `199:2552` | `toggle-group` with `variant="segment"`                                                                         |
| Tab item, Tabs             | `199:2561`, `199:2584` | `tabs` (`default` is the pill style, `line` the underline)                                                      |

## Shared components (`src/shared/ui`)

| Figma                              | Id                      | Code                                                                  |
| ---------------------------------- | ----------------------- | --------------------------------------------------------------------- |
| Logo                               | `216:7026`              | `Logo.svelte` (and `src/assets/logo.svg` for generated icons)         |
| Avatar (initial)                   | `198:2428`              | `InitialAvatar.svelte`                                                |
| Avatar stack                       | `198:2429`              | `AvatarStack.svelte`                                                  |
| FAB                                | `198:2467`              | `Fab.svelte`                                                          |
| Chip                               | `199:2489`              | `Chip.svelte`                                                         |
| Link                               | `200:2477`              | `TextLink.svelte`                                                     |
| Section header                     | `200:2478`              | `SectionHeader.svelte`                                                |
| List row                           | `200:2512`              | `ListRow.svelte`                                                      |
| Step indicator                     | `200:2513`              | `StepIndicator.svelte`                                                |
| Collapsible                        | `208:3138`              | `CollapsibleGroup.svelte`                                             |
| Empty state                        | `211:6430`              | `EmptyState.svelte`                                                   |
| Dropzone                           | `210:4444`              | `Dropzone.svelte`                                                     |
| Radio card                         | `210:4463`              | `RadioCard.svelte`                                                    |
| Action row                         | `210:4470`              | `ActionRow.svelte`                                                    |
| Detail row, Detail row / With icon | `211:4836`, `211:6444`  | `DetailRow.svelte`                                                    |
| Settings section                   | `211:4765`              | `SettingsSection.svelte`                                              |
| Contents link                      | `211:9107`              | `ContentsNav.svelte`                                                  |
| Autosave status                    | `230:7867`              | `AutosaveStatus.svelte`                                               |
| Dialogs (`162:2026`)               |                         | `DialogShell.svelte`                                                  |
| Board card                         | `208:7726`              | `board/BoardCard.svelte`                                              |
| Kanban column, Kanban empty        | `208:7756`, `211:10858` | `board/KanbanColumn.svelte`, moved by drag or `board/MoveMenu.svelte` |

## Shell (`src/app/shell`, #73)

| Figma                               | Id                                 |
| ----------------------------------- | ---------------------------------- |
| Rail / Desktop, Nav item / Desktop  | `208:3788`, `208:3148`             |
| Top bar / Desktop                   | `185:779`                          |
| Mobile app bar                      | `200:2546`                         |
| Mobile tab bar, Tab bar item        | `200:2748`, `200:2567`             |
| Public header, Auth hero, Auth card | `211:8883`, `211:8913`, `211:8929` |

## Look and feel (`src/features/spaces/ui/look`, #75)

Swatch `229:7948`, Option tile `229:7959`, Look preview `230:7804` with Thumb/* `229:7806` to
`229:7931`, Background image field `238:8452`, Colour picker `239:8487`.

## Feature components

| Figma                                                    | Id                                             | Feature                     | Issue |
| -------------------------------------------------------- | ---------------------------------------------- | --------------------------- | ----- |
| Note card                                                | `211:4794`                                     | notes                       | #76   |
| Watch title card, Star rating                            | `211:4823`, `211:6831`                         | watch                       | #77   |
| Catalog add action                                       | `230:7864`                                     | catalog                     | #84   |
| Idea header, Idea toolbar, Idea list card                | `208:7505`, `211:10826`, `211:10844`           | ideas                       | #78   |
| Comment, Comment composer                                | `210:4396`, `210:4418`                         | comments                    | #78   |
| Task row, Task card, Stat tile                           | `210:4494`, `211:7776`, `211:8951`             | tasks, budget               | #79   |
| Event row, Calendar event chip, Calendar day, Agenda day | `210:4484`, `211:4841`, `211:4864`, `211:6479` | calendar                    | #80   |
| Module row                                               | `211:6732`                                     | spaces                      | #81   |
| Card / With actions                                      | `208:7788`                                     | `card` with a header action | #76   |
