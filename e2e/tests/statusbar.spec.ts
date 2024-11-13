import { test, expect, type Page } from "@playwright/test";
import { getEditor } from "../helpers/utils";

function getJsonPaths(page: Page) {
  return page.getByTestId("statusbar").getByLabel("breadcrumb").getByRole("listitem", { includeHidden: false });
}

test.describe("sidenav", () => {
  test.beforeEach(async ({ page }) => {
    await getEditor(page, { goto: true, needTutorial: true });
  });

  test("display cursor JSON path", async ({ page }) => {
    const editor = await getEditor(page);
    await expect(editor).toContainText("The Wire");
    await page.locator(".view-lines > div:nth-child(5)").getByText("The Wire").first().click();

    {
      const pathElements = await getJsonPaths(page);
      await expect(pathElements).toHaveText(["$", "Aidan Gillen", "array", "1"]);

      await pathElements.nth(1).click();
      await expect(pathElements).toHaveText(["$", "Aidan Gillen"]);
    }

    {
      await page.getByText("string").first().click();
      const pathElements = await getJsonPaths(page);
      await expect(pathElements).toHaveText(["$", "Aidan Gillen", "string"]);
    }
  });

  test("display validation errors", async ({ page }) => {
    const editor = await getEditor(page);
    await expect(editor).toContainText("The Wire");
    await page.getByText("The Wire").first().click();
    await page.keyboard.press("End");
    await page.keyboard.press("Backspace");

    await expect(page.getByTestId("parse-error")).toContainText(/Ln 5, col 7 parsing error:/);
    await expect(page.getByTestId("parse-error")).toContainText(/\s+"The Wire\s+\],/);
  });

  test("display cursor position", async ({ page }) => {
    const editor = await getEditor(page);
    await expect(editor).toContainText("The Wire");

    await page.getByText("The Wire").first().click();
    await page.keyboard.press("End");
    await expect(page.getByTestId("cursor-position")).toHaveText("5:17");

    await page.getByText("Wire").first().dblclick();
    await expect(page.getByTestId("cursor-position")).toHaveText(/\d+:\d+\s*\(4 selected\)/);
  });
});
