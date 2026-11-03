import { describe, expect, it } from "vitest"
import { like } from "./like-filter"
import { anyOf } from "./query-filter"
import { pattern, quoted } from "@/features/search/infrastructure/search-sources"

describe("demo literal search", () => {
  it("supports multiline/case-insensitive wildcards and escaped literal characters", () => {
    expect(like("Hi\nTED LASSO", "%ted%")).toBe(true)
    expect(like("a%b_c\\d", pattern("%b_c\\"))).toBe(true)
    expect(like("axbZc\\d", pattern("%b_c\\"))).toBe(false)
    expect(like("ax", "a_")).toBe(true)
  })
  it("does not turn quoted commas and parentheses into additional conditions", () => {
    const query = 'x",id.gt.0,(abc)'
    const filter = `title.ilike.${quoted(pattern(query))},body.ilike.${quoted(pattern(query))}`
    expect(anyOf({ title: `A ${query} B`, body: "" }, filter)).toBe(true)
    expect(anyOf({ title: "no", body: "", id: "9" }, filter)).toBe(false)
  })
})
