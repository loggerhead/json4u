import { expect, type Page } from "@playwright/test";

export async function getEditor(page: Page) {
  const editor = await page.locator("#left-panel").locator(".view-lines");
  await expect(editor).toBeVisible();
  return editor;
}
