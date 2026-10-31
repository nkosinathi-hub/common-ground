import { clsx, type ClassValue } from "clsx"
import { extendTailwindMerge } from "tailwind-merge"

// Local change: the generated type-* text styles set size, weight, leading and family together,
// so a later type-* replaces a component's default text-lg or font-semibold.
const TYPE_STYLES = [
  "display",
  "h1",
  "h2",
  "h3",
  "body",
  "sm",
  "xs",
  "label",
  "label-sm",
  "overline",
]
// The generated container widths (max-w-dialog-wide, w-field-date) replace a component's own.
const CONTAINERS = [
  "content",
  "aside",
  "prose",
  "form",
  "auth",
  "auth-field",
  "dialog",
  "dialog-wide",
  "public",
  "field-date",
  "field-time",
  "field-select",
  "field-number",
  "field-hex",
  "field-search",
]
const twMerge = extendTailwindMerge<"type-style">({
  extend: {
    theme: { container: CONTAINERS },
    classGroups: { "type-style": [{ type: TYPE_STYLES }] },
    conflictingClassGroups: {
      "type-style": ["font-size", "font-weight", "leading", "font-family"],
    },
  },
})

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type WithoutChild<T> = T extends { child?: any } ? Omit<T, "child"> : T
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type WithoutChildren<T> = T extends { children?: any } ? Omit<T, "children"> : T
export type WithoutChildrenOrChild<T> = WithoutChildren<WithoutChild<T>>
export type WithElementRef<T, U extends HTMLElement = HTMLElement> = T & { ref?: U | null }
