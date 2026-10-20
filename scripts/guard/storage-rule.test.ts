import { describe, expect, it } from "vitest"
import { checkStorage } from "./storage-rule"

describe("storage rule", () => {
  it("lets only the device store touch web storage, so sign-out forgets every key", () => {
    const use = "localStorage.setItem('k', 'v')\n"
    expect(checkStorage("src/features/notes/ui/remembered.ts", use)).toHaveLength(1)
    expect(
      checkStorage("src/app/routing/pending-invite.ts", "sessionStorage.clear()\n"),
    ).toHaveLength(1)
    expect(checkStorage("src/app/App.svelte", "<script>localStorage</script>\n")).toHaveLength(1)
    expect(checkStorage("src/shared/ui/device-store.ts", use)).toEqual([])
    expect(checkStorage("src/features/notes/ui/remembered.test.ts", use)).toEqual([])
    expect(checkStorage("public/mode-init.js", use)).toEqual([])
    expect(checkStorage("src/app/x.ts", "const stored = deviceStore()\n")).toEqual([])
  })
})
