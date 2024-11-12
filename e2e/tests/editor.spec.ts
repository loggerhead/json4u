import { test, expect } from "@playwright/test";
import { clearEditor, getEditor, selectAllInEditor, writeToClipboard } from "../helpers/utils";

test.describe("edit in the editor", () => {
  test.beforeEach(async ({ page }) => {
    await getEditor(page, { goto: true, needTutorial: true });
  });

  test("typing will not reset the cursor", async ({ page }) => {
    await page.locator(".view-lines > div:nth-child(5)").getByText("Wire").first().dblclick();
    await page.keyboard.press("Backspace");
    await page.keyboard.type("world");
    await expect(page.getByRole("treeitem").getByText("The world")).toBeVisible();
  });

  test("deleting all text and typing will not reset the cursor", async ({ page }) => {
    await clearEditor(page);
    await page.keyboard.type("123");
    await expect(page.getByRole("treeitem").getByText("123")).toBeVisible();
    await page.keyboard.type("456");
    await expect(page.getByRole("treeitem").getByText("123456")).toBeVisible();
  });

  test("partially pasting will not reset the cursor", async ({ page }) => {
    await page.getByText('"string"', { exact: true }).dblclick();
    await page.keyboard.press("ControlOrMeta+C");
    await page.locator(".view-lines > div:nth-child(5)").getByText("Wire").first().dblclick();
    await page.keyboard.press("ControlOrMeta+V");
    await expect(page.getByRole("treeitem").getByText("The string")).toBeVisible();
  });

  test("pasting and replacing the whole text will reset the cursor", async ({ page }) => {
    await writeToClipboard(page, '"hello": "world"}');
    await selectAllInEditor(page);
    await page.keyboard.press("ControlOrMeta+V");
    await page.waitForTimeout(100);
    await page.keyboard.type("{");
    await expect(page.getByRole("treeitem").getByText("hello")).toBeVisible();
  });
});
