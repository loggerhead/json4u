import { test, expect } from "@playwright/test";
import { getEditor, getMaxLineNumber } from "../helpers/utils";

test.describe("commands", () => {
  test.beforeEach(async ({ page }) => {
    await getEditor(page, { goto: true });
  });

  test("open command list", async ({ page }) => {
    const search = page.locator("#cmd-search");
    await search.click();
    await search.getByRole("option").first().hover();
    await page.mouse.wheel(0, 100);
    await expect(page.getByText("Show jq input box")).toBeVisible();
  });

  test("format and minify", async ({ page }) => {
    await expect(await getMaxLineNumber(page)).toBeGreaterThan(1);
    {
      const search = page.locator("#cmd-search");
      await search.click();
      await search.locator("input").fill("minify");
      await search.getByRole("option").first().click();
      await expect(await getMaxLineNumber(page)).toBe(1);
    }
    {
      const search = page.locator("#cmd-search");
      await search.click();
      await search.locator("input").fill("format");
      await search.getByRole("option").first().click();
      await expect(await getMaxLineNumber(page)).toBeGreaterThan(1);
    }
  });
});
