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
  await page.keyboard.press(",");
  await expect(page.getByTestId("statusbar")).toHaveText('Ln 6, col 5 parsing error:...Wire", ], "string...');
});
