import { test, expect } from "@playwright/test";
import { getEditor } from "../helpers/utils";

test.describe("Search command", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/editor");
  });

  test("Search command", async ({ page }) => {
    const editor = await getEditor(page);
    await expect(editor).toContainText("Aidan Gillen");
  });
});
