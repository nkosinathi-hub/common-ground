import { cleanup, fireEvent, render, screen } from "@testing-library/svelte"
import { afterEach, describe, expect, it } from "vitest"
import Attribution from "./Attribution.svelte"
import Poster from "./Poster.svelte"

afterEach(cleanup)

describe("Poster", () => {
  it("renders the TMDB image for a valid path", () => {
    render(Poster, { props: { path: "/abc.jpg", title: "Dune" } })
    expect(screen.getByRole("img", { name: "Dune poster" })).toHaveAttribute(
      "src",
      "https://image.tmdb.org/t/p/w185/abc.jpg",
    )
  })

  it("falls back when there is no poster or it fails to load", async () => {
    render(Poster, { props: { path: null, title: "Unknown" } })
    expect(screen.getByText("No poster for Unknown")).toBeInTheDocument()
    render(Poster, { props: { path: "/broken.jpg", title: "Broken" } })
    await fireEvent.error(screen.getByRole("img", { name: "Broken poster" }))
    expect(screen.getByText("No poster for Broken")).toBeInTheDocument()
  })
})

describe("Attribution", () => {
  it("credits TMDB and JustWatch as their terms require", () => {
    render(Attribution)
    expect(screen.getByRole("img", { name: "TMDB" }).getAttribute("src")).toMatch(/tmdb-logo\.svg$/)
    expect(
      screen.getByText("This product uses the TMDB API but is not endorsed or certified by TMDB."),
    ).toBeInTheDocument()
    expect(screen.getByText(/Streaming data by/)).toHaveTextContent("Streaming data by JustWatch")
    expect(screen.getByRole("link", { name: "JustWatch" })).toHaveAttribute(
      "href",
      "https://www.justwatch.com/",
    )
  })
})
