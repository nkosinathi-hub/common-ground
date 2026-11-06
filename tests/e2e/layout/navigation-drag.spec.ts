import { expect, test, type CDPSession, type Page } from "@playwright/test"
import { activatePageAction } from "../support/navigation"

const center = async (page: Page) => {
  const box = (await page.locator(".fan-trigger").boundingBox())!
  return { x: box.x + box.width / 2, y: box.y + box.height / 2 }
}
async function hold(page: Page, touch: CDPSession) {
  await touch.send("Input.dispatchTouchEvent", {
    type: "touchStart",
    touchPoints: [await center(page)],
  })
  await page.waitForTimeout(500) // Hold is the input being tested, not a readiness delay.
  await expect(page.locator(".radial-nav")).toHaveAttribute("data-dragging", "")
  await page.waitForFunction(() =>
    [...document.querySelectorAll(".fan-route")].every((node) => node.getAnimations().length === 0),
  )
}
async function drag(page: Page, touch: CDPSession, name: string) {
  const fan = page.getByRole("navigation", { name: "Main", exact: true })
  const box = (await fan
    .getByRole("link", { name, exact: true })
    .or(fan.getByRole("button", { name, exact: true }))
    .boundingBox())!
  await touch.send("Input.dispatchTouchEvent", {
    type: "touchMove",
    touchPoints: [{ x: box.x + box.width / 2, y: box.y + box.height / 2 }],
  })
  await expect(page.locator("[data-drag-selected]")).toHaveAccessibleName(name)
  await expect(page.locator(".touch-action-label")).toHaveText(`Release for ${name}`)
}

test("hold, drag and release chooses the last route without changing normal taps @mobile", async ({
  page,
}, info) => {
  test.skip(info.project.name === "desktop", "Uses real touch pointer events")
  await page.goto("./#/demo")
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible()
  const touch = await page.context().newCDPSession(page)
  await hold(page, touch)
  await drag(page, touch, "Watch")
  await drag(page, touch, "Notes")
  await touch.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] })
  await expect(page.getByRole("heading", { name: "Notes", exact: true })).toBeVisible()
  await expect(page.locator(".radial-nav")).not.toHaveAttribute("data-dragging")
  await expect(page.getByRole("dialog")).toHaveCount(0)
  await hold(page, touch)
  await drag(page, touch, "Watch")
  await touch.send("Input.dispatchTouchEvent", {
    type: "touchMove",
    touchPoints: [{ x: 10, y: 200 }],
  })
  await expect(page.locator("[data-drag-selected]")).toHaveCount(0)
  await touch.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] })
  await expect(page.getByRole("heading", { name: "Notes", exact: true })).toBeVisible()
  await page.keyboard.press("Escape")
  await activatePageAction(page, "Write a note")
  await expect(page.getByRole("dialog")).toBeVisible()
})

test("holding the title FAB exposes routes while a normal tap plays immediately @mobile", async ({
  page,
}, info) => {
  test.skip(info.project.name === "desktop", "Uses real touch pointer events")
  await page.goto(
    "/?demo=1#/s/00000000-0000-4000-a000-000000000001/watch/00000000-0000-4000-a000-000000000010",
  )
  await expect(page.getByRole("heading", { name: "Episodes", exact: true })).toBeVisible()
  const touch = await page.context().newCDPSession(page)
  await page.locator(".fan-trigger").tap()
  const player = page.getByRole("dialog", { name: "Watching Ted Lasso", exact: true })
  await expect(player).toBeVisible()
  await page.keyboard.press("Escape")
  await expect(player).toBeHidden()
  await hold(page, touch)
  await drag(page, touch, "Home")
  await touch.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] })
  await expect(page.getByRole("heading", { name: /Good .*, Ana/ })).toBeVisible()
})
