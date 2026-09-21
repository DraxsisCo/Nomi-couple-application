import { expect, test } from "@playwright/test";

test("login is usable in Persian and supports zoom", async ({ page }) => {
  await page.goto("/login");
  await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
  await expect(page.getByRole("textbox", { name: /ایمیل/ })).toBeVisible();
  await expect(page.getByRole("button", { name: "ورود" })).toBeEnabled();
  await page.evaluate(() => { document.body.style.zoom = "2"; });
  await expect(page.getByRole("button", { name: "ورود" })).toBeVisible();
});
