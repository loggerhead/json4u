import { test, expect, type Page } from "@playwright/test";
import { getEditor } from "../helpers/utils";

function getJsonPaths(page: Page) {
  return page.getByTestId("statusbar").getByLabel("breadcrumb").getByRole("listitem", { includeHidden: false });
}

test("display cursor JSON path", async ({ page }) => {
  const editor = await getEditor(page, { goto: true });
  await expect(editor).toContainText("The Wire");
  await page.getByText("The Wire").nth(0).click();

  {
    const pathElements = await getJsonPaths(page);
    await expect(pathElements).toHaveText(["Aidan Gillen", "array", "1"]);

    await pathElements.nth(0).click();
    await expect(pathElements).toHaveText(["Aidan Gillen"]);
  }

  {
    await page.getByText("string").nth(0).click();
    const pathElements = await getJsonPaths(page);
    await expect(pathElements).toHaveText(["Aidan Gillen", "string"]);
  }
});

test("display validation errors", async ({ page }) => {
  const editor = await getEditor(page, { goto: true });
  await expect(editor).toContainText("The Wire");
  await page.getByText("The Wire").nth(0).click();
  await page.keyboard.press("End");
  await page.keyboard.press("Backspace");

  await expect(page.getByTestId("parse-error")).toContainText(/Ln 5, col 7 parsing error:/);
  await expect(page.getByTestId("parse-error")).toContainText(/\s+"The Wire\s+\],/);
});
