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

export async function importJsonFile(page: Page, fileName: string) {
  await page.getByRole("button", { name: "Import" }).click();
  await page
    .locator("div")
    .filter({ hasText: /^Click here to select file or drop a file right here$/ })
    .setInputFiles(getFilePath(fileName));
}

export function getFilePath(fileName: string) {
  return path.join(process.cwd(), "__tests__/fixtures/", fileName);
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

// NOTICE: the entire node should be visible in the graph; otherwise, a click may not select it.
export function getGraphNode(page: Page, id: string) {
  return page.getByTestId(`rf__node-${id}`);
}

export function hasHighlight(page: Page) {
  return page.evaluate(() => {
    if (CSS.highlights) {
      return !!CSS.highlights.get("search-highlight");
    } else {
      return !!document.querySelector(".search-highlight");
    }
  });
}
