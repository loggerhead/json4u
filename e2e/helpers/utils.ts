import { expect, type Locator, type Page } from "@playwright/test";
import fs from "fs";
import path from "path";

interface Options {
  goto?: boolean;
  rightEditor?: boolean;
}

export async function getEditor(page: Page, options?: Options) {
  if (options?.goto) {
    await page.goto("/editor");
  }

  const id = `#${options?.rightEditor ? "right" : "left"}-panel`;
  const editor = await page.locator(id).locator(".view-lines");
  await expect(editor).toBeVisible();
  return editor;
}

export function getFilePath(name: string) {
  return path.join(process.cwd(), "__tests__/fixtures/", name);
}

export async function getDownloadText(page: Page, downloadFn: () => void) {
  const downloadPromise = page.waitForEvent("download");
  await downloadFn();
  const download = await downloadPromise;
  const filePath = await download.path();
  const content = await fs.readFileSync(filePath, "utf8");
  return content;
}

export function getBackgroundColor(locator: Locator) {
  return locator.evaluate((el) => window.getComputedStyle(el).getPropertyValue("background-color"));
}

export function getGraphNode(page: Page, id: string) {
  return page.getByTestId(`rf__node-${id}`);
}
