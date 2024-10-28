import { test } from "@playwright/test";

test("basic graph", async ({ page }) => {
  await page.goto("/editor");
});
