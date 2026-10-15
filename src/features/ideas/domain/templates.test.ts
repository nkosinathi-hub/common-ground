import { describe, expect, it } from "vitest"
import type { IdeaTemplate } from "./idea"
import { IDEA_TEMPLATE_OPTIONS, templateBrief } from "./templates"

describe("templates", () => {
  it("offers Blank, Business idea and Creative project", () => {
    expect(IDEA_TEMPLATE_OPTIONS.map((t) => t.label)).toEqual([
      "Blank",
      "Business idea",
      "Creative project",
    ])
  })

  it("blank starts empty; the others prompt their own fields", () => {
    expect(templateBrief("blank")).toEqual({})
    expect(Object.keys(templateBrief("business"))).toContain("revenueModel")
    expect(Object.keys(templateBrief("creative"))).not.toContain("revenueModel")
    expect(templateBrief("unknown" as IdeaTemplate)).toEqual({})
  })
})
