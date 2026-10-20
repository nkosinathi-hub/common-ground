import { createServer, type Server } from "node:http"
import type { AddressInfo } from "node:net"
import { expect, test } from "@playwright/test"

// GitHub Pages cannot send frame-ancestors; the app itself refuses to render inside a frame.
// The framing page is a real server on another port: a different origin, still on loopback.
async function framer(target: string): Promise<{ url: string; server: Server }> {
  const html = `<iframe title="victim" src="${target}" width="800" height="600"></iframe>`
  const server = createServer((_req, res) => res.end(html))
  await new Promise<void>((done) => server.listen(0, "127.0.0.1", done))
  const { port } = server.address() as AddressInfo
  return { url: `http://127.0.0.1:${port}/`, server }
}

test("another site framing the app gets only a link out, never the app", async ({
  page,
  baseURL,
}) => {
  const { url, server } = await framer(`${baseURL}/#/auth/sign-in`)
  try {
    await page.goto(url)
    const framed = page.frameLocator('iframe[title="victim"]')
    await expect(framed.getByText("Common Ground only opens in its own tab")).toBeVisible()
    const out = framed.getByRole("link", { name: "Open Common Ground" })
    await expect(out).toHaveAttribute("target", "_top")
    await expect(framed.getByRole("button")).toHaveCount(0)
    await expect(framed.getByLabel("Password")).toHaveCount(0)
  } finally {
    server.close()
  }
})

test("opened directly, the app renders and sends only its origin as referrer", async ({ page }) => {
  await page.goto("./#/auth/sign-in")
  await expect(page.getByRole("heading", { name: "Welcome back" })).toBeVisible()
  await expect(page.locator('meta[name="referrer"]')).toHaveAttribute("content", "strict-origin")
})
