import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/svelte"
import { afterEach, describe, expect, it } from "vitest"
import { ok, type Ok } from "@/shared/domain"
import Provided from "@/shared/ui/testing/Provided.svelte"
import { AttachmentsService } from "../application/attachments-service"
import { FakeAttachmentsGateway, FakeUploader, attachment } from "../testing/fake-attachments"
import AttachmentItem from "./AttachmentItem.svelte"
import { provideAttachments } from "./context"

afterEach(cleanup)

/** A gateway whose signed URLs resolve only when the test answers them. */
class SlowGateway extends FakeAttachmentsGateway {
  readonly waiting: { id: string; resolve: (url: Ok<string>) => void }[] = []
  override signedUrl(id: string) {
    return new Promise<Ok<string>>((resolve) => this.waiting.push({ id, resolve }))
  }
  answer(index: number, url: string) {
    this.waiting[index]!.resolve(ok(url))
  }
}

function setup() {
  const gateway = new SlowGateway()
  const service = new AttachmentsService(gateway, new FakeUploader())
  const provide = () => provideAttachments({ service })
  const props = { attachment: attachment("a"), deletable: false, onDelete: () => {} }
  render(Provided, { props: { provide, component: AttachmentItem, props } })
  return { gateway }
}

describe("AttachmentItem preview", () => {
  it("fetches a fresh URL once when the preview fails to load", async () => {
    const { gateway } = setup()
    gateway.answer(0, "https://signed/expired")
    await fireEvent.error(await screen.findByRole("img", { name: "a.png" }))
    await waitFor(() => expect(gateway.waiting).toHaveLength(2))
    gateway.answer(1, "https://signed/fresh")
    await waitFor(() =>
      expect(screen.getByRole("img", { name: "a.png" })).toHaveAttribute(
        "src",
        "https://signed/fresh",
      ),
    )
    await fireEvent.error(screen.getByRole("img", { name: "a.png" }))
    expect(gateway.waiting).toHaveLength(2)
    expect(screen.getByText(/Could not open this file/)).toBeInTheDocument()
  })
})
