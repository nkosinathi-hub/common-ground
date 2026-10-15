import { describe, expect, it } from "vitest"
import { safeHref } from "./safe-href"

describe("safeHref", () => {
  it.each([["https://www.themoviedb.org/movie/1/watch?locale=ZA"], ["http://example.com/watch"]])(
    "keeps the absolute web link %s",
    (url) => {
      expect(safeHref(url)).toBe(url)
    },
  )

  it.each([
    ["a javascript: URL", "javascript:alert(1)"],
    ["a mixed-case javascript: URL", " JavaScript:alert(1)"],
    ["a data: URL", "data:text/html,<p>hi</p>"],
    ["a relative path", "/movie/1/watch"],
    ["a protocol-relative URL", "//evil.example/x"],
    ["a malformed URL", "http://"],
    ["an empty string", ""],
    ["no link", null],
  ])("refuses %s", (_case, url) => {
    expect(safeHref(url)).toBeNull()
  })
})
