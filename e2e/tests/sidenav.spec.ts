import { test } from "@playwright/test";

test("sidenav", async ({ page }) => {
  await page.goto("/editor");
});
