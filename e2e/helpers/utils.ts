import { expect, type Locator, type Page } from "@playwright/test";
import fs from "fs";
import { filter } from "lodash-es";
import path from "path";

interface Options {
  goto?: boolean;
  rightEditor?: boolean;
  textarea?: boolean;
}

function getEditorId(rightEditor?: boolean) {
  return `#${rightEditor ? "right" : "left"}-panel`;
}

export async function getEditor(page: Page, options?: Options) {
  if (options?.goto) {
    await page.goto("/editor");
  }

  const id = getEditorId(options?.rightEditor);
  const editor = await page.locator(id).locator(options?.textarea ? "textarea" : ".view-lines");
  await expect(editor).toBeVisible();
  return editor;
}

export async function clearEditor(page: Page, options?: Options) {
  const id = getEditorId(options?.rightEditor);
  const editor = await getEditor(page, { ...options, textarea: true });

  // For an unknown reason, Ctrl+A will not select all the text and `locator.fill("")` will only remove part of it.
  // So we need to loop and check the number of line numbers to clear all the text.
  while (true) {
    await editor.fill("");
    const lns = filter(await page.locator(`${id} .line-numbers`).allInnerTexts());
    if (lns.length <= 1) {
      break;
    }
  }
}

export async function selectAllInEditor(page: Page, options?: Options) {
  const id = getEditorId(options?.rightEditor);
  await page.locator(`${id} .view-lines > div:nth-child(1)`).click();
  await page.keyboard.press("Home");

  for (let i = 0; i < 20; i++) {
    await page.keyboard.press("ControlOrMeta+A");
    await page.waitForTimeout(100);
  }
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
