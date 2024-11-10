import { test, expect } from "@playwright/test";
import { getEditor } from "../helpers/utils";

// TODO: add tests
test.describe("commands", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/editor");
  });

  test("format and minify", async ({ page }) => {});
});
