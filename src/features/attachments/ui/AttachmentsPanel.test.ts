import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/svelte"
import { afterEach, describe, expect, it, vi } from "vitest"
import { AttachmentsService } from "../application/attachments-service"
import {
  FakeAttachmentsGateway,
  FakeUploader,
  IDEA_ID,
  SPACE_ID,
  attachment,
} from "../testing/fake-attachments"
import AttachmentsPanel from "./AttachmentsPanel.svelte"
import { provideAttachments } from "./context"
import Provided from "@/shared/ui/testing/Provided.svelte"

const opened = vi.hoisted(() => [] as string[])
vi.mock("./open-url", () => ({ openUrl: (url: string) => opened.push(url) }))

function setup(props: { me?: string; isOwner?: boolean } = {}) {
  const gateway = new FakeAttachmentsGateway()
  const uploader = new FakeUploader()
  gateway.items = [
    attachment("pic", { filename: "Sketch <b>.png", uploaderId: "me" }),
    attachment("doc", { filename: "plan.pdf", mime: "application/pdf", uploaderId: "them" }),
  ]
  const service = new AttachmentsService(gateway, uploader)
  const panel = {
    spaceId: SPACE_ID,
    ideaId: IDEA_ID,
    me: props.me ?? "me",
    isOwner: !!props.isOwner,
  }
  const provide = () => provideAttachments({ service })
  render(Provided, { props: { provide, component: AttachmentsPanel, props: panel } })
  const input = screen.getByLabelText<HTMLInputElement>("Choose a file to attach")
  const choose = (file: File) => fireEvent.change(input, { target: { files: [file] } })
  return { gateway, uploader, input, choose }
}

const png = (name = "new.png") => new File([new Uint8Array(64)], name, { type: "image/png" })

describe("AttachmentsPanel", () => {
  afterEach(() => cleanup())

  it("accepts only the four types and lists previews and PDF rows", async () => {
    const { gateway, input } = setup()
    expect(input.accept).toContain("image/webp")
    const image = await screen.findByRole("img", { name: "Sketch <b>.png" })
    await waitFor(() =>
      expect(image).toHaveAttribute("src", expect.stringContaining("/signed/pic")),
    )
    await fireEvent.click(screen.getByRole("button", { name: "Download plan.pdf" }))
    await waitFor(() => expect(opened.at(-1)).toContain("signed/doc?d=attachment"))
    expect(gateway.urls).toContainEqual({ id: "doc", disposition: "attachment" })
  })

  it("rejects an oversized or wrong-typed file before uploading", async () => {
    const { gateway, choose } = setup()
    await choose(new File(["GIF89a"], "a.gif", { type: "image/gif" }))
    expect(screen.getByRole("alert")).toHaveTextContent("Only JPEG, PNG, WebP and PDF")
    expect(gateway.started).toHaveLength(0)
  })

  it("shows progress, can cancel, and lists a finished upload", async () => {
    const { gateway, uploader, choose } = setup()
    uploader.autoFinish = false
    await choose(png())
    const bar = await screen.findByRole("progressbar", { name: "Upload progress" })
    await waitFor(() => expect(bar).toHaveAttribute("aria-valuenow", "50"))
    await fireEvent.click(screen.getByRole("button", { name: "Cancel upload" }))
    await waitFor(() => expect(screen.queryByRole("progressbar")).not.toBeInTheDocument())
    expect(screen.queryByRole("alert")).not.toBeInTheDocument()

    uploader.autoFinish = true
    await choose(png("final.png"))
    expect(await screen.findByRole("img", { name: "final.png" })).toBeInTheDocument()
    expect(gateway.started).toHaveLength(2)
  })

  it("shows why the server rejected a file", async () => {
    const { gateway, choose } = setup()
    gateway.failFinalize = { kind: "validation", message: "Contents do not match" }
    await choose(png())
    expect(await screen.findByRole("alert")).toHaveTextContent("Contents do not match")
  })

  it("offers delete to the uploader only, and confirms first", async () => {
    const { gateway } = setup()
    await screen.findByText("plan.pdf")
    expect(screen.queryByRole("button", { name: "Delete plan.pdf" })).not.toBeInTheDocument()
    await fireEvent.click(screen.getByRole("button", { name: "Delete Sketch <b>.png" }))
    await fireEvent.click(await screen.findByRole("button", { name: "Delete" }))
    await waitFor(() => expect(gateway.removed).toEqual(["pic"]))
    await waitFor(() => expect(screen.queryByText("Sketch <b>.png")).not.toBeInTheDocument())
  })

  it("lets the owner delete anyone's file", async () => {
    setup({ isOwner: true })
    expect(await screen.findByRole("button", { name: "Delete plan.pdf" })).toBeInTheDocument()
  })
})
