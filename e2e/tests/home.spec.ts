import { test, expect } from "@playwright/test";
import { getEditor } from "../helpers/utils";

test.describe("Home page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("go to editor", async ({ page }) => {
    await page.getByRole("link", { name: "Try it now" }).click();
    await getEditor(page);
  });

  test("go to login", async ({ page }) => {
    await page.getByRole("link", { name: /Log in/ }).click();
    await expect(page.locator("text=Login with Google")).toBeVisible();
  });

  test("go to terms", async ({ page }) => {
    await page.getByRole("link", { name: /Terms/ }).click();
    await expect(page.getByRole("heading", { name: "AGREEMENT TO OUR LEGAL TERMS" })).toBeVisible();
  });

  test("go to privacy", async ({ page }) => {
    await page.getByRole("link", { name: /Privacy/ }).click();
    await expect(page.getByRole("heading", { name: "WHAT INFORMATION DO WE COLLECT?" })).toBeVisible();
  });
});
