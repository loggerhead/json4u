import { test, expect } from "@playwright/test";
import { getEditor, getBackgroundColor, getDownloadText, getFilePath, importJsonFile } from "../helpers/utils";

test.describe("Sidenav", () => {
  test.beforeEach(async ({ page }) => {
    await getEditor(page, { goto: true, needTutorial: true });
  });

  test("click logo", async ({ page }) => {
    await page.getByRole("link", { name: /JSON For You/ }).click();
    await expect(page.getByRole("link", { name: "Try it now" })).toBeVisible();
  });

  test("click log in", async ({ page }) => {
    await page.getByRole("button", { name: "Log in" }).click();
    await expect(page.locator("text=Login with Google")).toBeVisible();
  });

  test("import JSON file", async ({ page }) => {
    const editor = await getEditor(page);
    await importJsonFile(page, "nest.txt");
    await expect(editor).toContainText('"ccc"');
  });

  test("import CSV file without header", async ({ page }) => {
    const editor = await getEditor(page);

    await page.getByRole("button", { name: "Import" }).click();
    await page.locator("button").filter({ hasText: "JSON" }).click();
    await page.getByLabel("CSV").click();
    await page.getByText("File contains header").click();
    await page
      .locator("div")
      .filter({ hasText: /^Click here to select file or drop a file right here$/ })
      .setInputFiles(getFilePath("region_and_currency.csv"));

    await expect(editor).toContainText(/\[\s*"Region",/);
  });

  test("export JSON file", async ({ page }) => {
    await page.getByRole("button", { name: "Export" }).click();
    const content = await getDownloadText(
      page,
      async () => await page.getByRole("button", { name: "Download" }).click(),
    );
    await expect(content).toContain("Aidan Gillen");
  });

  test("export CSV file with preview", async ({ page }) => {
    const editor = await getEditor(page);

    // import CSV file with header
    await page.getByRole("button", { name: "Import" }).click();
    await page.locator("button").filter({ hasText: "JSON" }).click();
    await page.getByLabel("CSV").click();
    await page
      .locator("div")
      .filter({ hasText: /^Click here to select file or drop a file right here$/ })
      .setInputFiles(getFilePath("region_and_currency.csv"));
    await expect(editor).toContainText('"Region":');

    await page.getByRole("button", { name: "Export" }).click();
    await page.locator("button").filter({ hasText: "JSON" }).click();
    await page.getByLabel("CSV").click();

    // preview CSV file
    await page.getByRole("button", { name: "Preview" }).click();
    const rightEditor = await getEditor(page, { rightEditor: true });
    await expect(rightEditor).toContainText("Region,Region Code,Currency");

    // download CSV file
    const content = await getDownloadText(
      page,
      async () => await page.getByRole("button", { name: "Download" }).click(),
    );
    await expect(content).toContain("Region,Region Code,Currency");
  });

  test("toggle buttons", async ({ page }) => {
    const editor = await getEditor(page);

    const testBtn = async (name: string) => {
      const btn = await page.getByRole("button", { name });
      await expect(btn).toBeVisible();

      await editor.click();
      const color1 = await getBackgroundColor(btn);

      await btn.click();
      await editor.click();
      const color2 = await getBackgroundColor(btn);

      await btn.click();
      await editor.click();
      const color3 = await getBackgroundColor(btn);

      // TODO: for unknown reasons, the color is actually changed but does not get the right value in the case
      await expect(color1).not.toEqual(color2);
      await expect(color2).not.toEqual(color3);
    };

    await testBtn("Auto Format");
    await testBtn("Nested Parse");
    await testBtn("Auto Sort");
  });
});
