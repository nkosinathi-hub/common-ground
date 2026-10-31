# Design tokens

The Figma file `pQC2lr3ooWFwMLs3UFP0wc`, page "Refined Feedback v2 (spacing)" (`162:2`), is the
source of every visual value in the app.

## Where the values live

- `src/shared/domain/design/figma-export.json`: the variables (Layout, Radius, Color) and the
  text and effect styles, exactly as Figma exports them.
- `src/shared/domain/design/tokens.ts`: the typed view of that export. Contrast checks and the
  space look read colours from here.
- `src/styles/generated/`: the CSS written from the export. Never edit it by hand.
  - `variables.css`: the raw values. `:root` is Light, Comfortable and Soft; `.dark`,
    `[data-density="compact|spacious"]` and `[data-radius="square|rounded"]` override only
    what changes.
  - `theme.css`: Tailwind's `@theme inline` names and one `type-<style>` utility per text style.

## Using them

| Figma              | Class                                        |
| ------------------ | -------------------------------------------- |
| `spacing/card`     | `p-card`, `gap-card`                         |
| `control/default`  | `h-control-default`                          |
| `container/form`   | `max-w-form`                                 |
| `field/date`       | `w-field-date`                               |
| `radius/lg`        | `rounded-lg`                                 |
| `heading/h1`       | `type-h1`                                    |
| `elevation/fab`    | `shadow-fab`                                 |
| `spacing/gutter-*` | `px-gutter` (steps up at 768, 1024 and 1440) |

## Refreshing from Figma

1. `pnpm design:tokens --export-script` prints the plugin script.
2. Run it with the Figma MCP `use_figma` tool on the file and save the returned JSON.
3. `pnpm design:tokens --from-figma <saved.json>` replaces the export and regenerates the CSS.
4. Review the diff. `scripts/design/tokens.test.ts` fails whenever the CSS and the export drift,
   and `src/styles/themes.test.ts` fails when a text and surface pair drops below 4.5:1.

## Logo and icons

`src/assets/logo.svg` is the Figma Logo (`216:7026`) and the only source of the mark.
`src/shared/ui/Logo.svelte` draws the same paths with the `brand` and `on-brand` tokens, and
`src/shared/ui/logo-source.test.ts` fails if the two drift.

After changing the logo, run both scripts from the repo root (ImageMagick 7 with librsvg). A
rerun is byte-identical.

- `bash scripts/icons/render-icons.sh`: `public/icon.svg` (the favicon), the manifest icons at
  192 and 512, the maskable icon, and the Apple touch icon.
- `bash scripts/icons/render-android.sh`: the launcher, round, foreground and monochrome icons
  at five densities, and the splash mark. The adaptive background is the lime tile colour.
  `ic_stat_notify` stays a silhouette and is not generated.
