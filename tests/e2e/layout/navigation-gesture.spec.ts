import { expect, test } from "@playwright/test"
import { navigateSection } from "../support/navigation"

test("one touch control keeps tap actions separate from hold and swipe navigation @mobile", async ({
  page,
}, info) => {
  test.skip(info.project.name === "desktop", "Real touch input uses the touch-enabled projects")
  await page.goto("./#/demo")
  await navigateSection(page, "Watch")
  const action = page.locator(".fan-trigger")
  await expect(action).toHaveAccessibleName("Add a title")
  await expect(page.locator(".radial-nav > button")).toHaveCount(1)
  const center = async () => {
    const rect = (await action.boundingBox())!
    return { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 }
  }
  const touch = await page.context().newCDPSession(page)
  await touch.send("Input.dispatchTouchEvent", {
    type: "touchStart",
    touchPoints: [await center()],
  })
  await page.waitForTimeout(500) // Holding is the input being exercised, not a readiness delay.
  await expect(action).toHaveAttribute("aria-expanded", "true")
  await touch.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] })
  await expect(page.getByRole("searchbox")).toHaveCount(0)
  await page
    .getByRole("navigation", { name: "Main", exact: true })
    .getByRole("link", { name: "Notes", exact: true })
    .click()
  await expect(action).toHaveAccessibleName("Write a note")
  const point = await center()
  await touch.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [point] })
  await touch.send("Input.dispatchTouchEvent", {
    type: "touchMove",
    touchPoints: [{ ...point, y: point.y - 45 }],
  })
  await touch.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] })
  await expect(action).toHaveAttribute("aria-expanded", "true")
  await expect(page.getByRole("dialog")).toHaveCount(0)
  await page
    .getByRole("navigation", { name: "Main", exact: true })
    .getByRole("link", { name: "Watch", exact: true })
    .click()
  await expect(action).toHaveAccessibleName("Add a title")
  const tap = await center()
  await page.touchscreen.tap(tap.x, tap.y)
  await expect(page.getByRole("searchbox", { name: "Search everything" })).toBeFocused()
  await expect(action).toHaveAttribute("aria-expanded", "false")
})
