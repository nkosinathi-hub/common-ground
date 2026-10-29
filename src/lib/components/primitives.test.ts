import { render } from "@testing-library/svelte"
import { describe, expect, it } from "vitest"
import { Avatar, AvatarFallback } from "$lib/components/ui/avatar"
import { Badge } from "$lib/components/ui/badge"
import { Button } from "$lib/components/ui/button"
import { NativeSelect } from "$lib/components/ui/native-select"
import { Toggle } from "$lib/components/ui/toggle"

/** The Figma Button set (176:155): five variants, five sizes, all from the design tokens. */
const SIZES = {
  default: ["h-control-default", "px-control-padding-default"],
  sm: ["h-control-inline", "px-control-padding-sm"],
  lg: ["h-control-touch", "px-control-padding-lg"],
  icon: ["size-control-default"],
  "icon-sm": ["size-control-inline"],
} as const
const VARIANTS = {
  default: ["bg-primary", "text-primary-foreground"],
  secondary: ["bg-secondary", "text-secondary-foreground"],
  outline: ["bg-card", "border-border", "text-primary"],
  ghost: ["text-primary", "hover:bg-muted"],
  destructive: ["bg-destructive", "text-destructive-foreground"],
} as const

const classes = (value: string) => value.split(/\s+/)
/** The rendered root's classes, so the test reads what the browser gets. */
const rendered = (component: never, props: Record<string, unknown>) =>
  classes(render(component, props).container.firstElementChild!.className)

describe("primitives follow the Figma components", () => {
  for (const [variant, colours] of Object.entries(VARIANTS))
    for (const [size, box] of Object.entries(SIZES))
      it(`button ${variant} ${size}`, () => {
        const css = rendered(Button as never, { variant, size })
        expect(css).toEqual(
          expect.arrayContaining([...colours, ...box, "rounded-md", "type-label"]),
        )
      })

  it("badges are full pills with the small label", () => {
    expect(rendered(Badge as never, { variant: "secondary" })).toEqual(
      expect.arrayContaining(["rounded-full", "type-label-sm", "bg-secondary", "text-primary"]),
    )
  })

  it("a segment sits on card fill when on", () => {
    expect(rendered(Toggle as never, { variant: "segment" })).toEqual(
      expect.arrayContaining(["data-[state=on]:bg-card", "data-[state=on]:shadow-xs"]),
    )
  })

  it("an avatar carries its tone for the fallback colours", () => {
    const { container } = render(Avatar, { tone: "brand", size: "lg", children: undefined })
    const root = container.querySelector('[data-slot="avatar"]')!
    expect(root.getAttribute("data-tone")).toBe("brand")
    expect(root.getAttribute("data-size")).toBe("lg")
    expect(AvatarFallback).toBeDefined()
  })

  it("a native select keeps the control heights and a chevron", () => {
    const { container } = render(NativeSelect, { size: "sm" })
    const select = container.querySelector("select")!
    expect(select.dataset.size).toBe("sm")
    expect(classes(select.className)).toEqual(
      expect.arrayContaining([
        "h-control-default",
        "data-[size=sm]:h-control-inline",
        "rounded-md",
      ]),
    )
    expect(container.querySelector('[data-slot="native-select-icon"]')).not.toBeNull()
  })
})
