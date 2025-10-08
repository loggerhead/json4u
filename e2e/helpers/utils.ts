import type { Kind } from "@/lib/editor/editor";
import type { editorApi } from "@/lib/editor/types";
import { expect, type Locator, type Page } from "@playwright/test";
import fs from "fs";
import path from "path";

interface Options {
  goto?: boolean;
  rightEditor?: boolean;
  textarea?: boolean;
  needTutorial?: boolean;
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
  await expect(editor).toBeAttached();
  await page.waitForFunction(() => window.monacoApi);

  // Wait for the completion of setting the text of the tutorial
  if (options?.needTutorial) {
    if (options?.textarea) {
      await expect(editor.inputValue()).toContain("Aidan Gillen");
    } else {
      await expect(editor).toContainText("Aidan Gillen");
    }
  }
  return editor;
}

export async function getMaxLineNumber(page: Page, rightEditor?: boolean) {
  const kind = rightEditor ? "secondary" : "main";
  return page.evaluate(
    ([kind]) => {
      const editor: editorApi.IStandaloneCodeEditor = window.monacoApi[kind as Kind];
      return editor.getValue().split("\n").length;
    },
    [kind],
  );
}

export async function clearEditor(page: Page, options?: Options) {
  const kind = options?.rightEditor ? "secondary" : "main";
  return page.evaluate(
    ([kind]) => {
      const editor: editorApi.IStandaloneCodeEditor = window.monacoApi[kind as Kind];
      editor.setSelection(new window.monacoApi.Range(0, 0, Infinity, Infinity));
      editor.getAction("editor.action.deleteLines")?.run();
      editor.focus();
    },
    [kind],
  );
}

// A tricky way to copy all the text in the editor since `ControlOrMeta+A` does not work for unknown reason.
export async function selectAllInEditor(page: Page, options?: Options & { lines?: number }) {
  const kind = options?.rightEditor ? "secondary" : "main";
  return page.evaluate(
    ([kind]) => {
      const editor: editorApi.IStandaloneCodeEditor = window.monacoApi[kind as Kind];
      editor.setSelection(new window.monacoApi.Range(0, 0, Infinity, Infinity));
      editor.focus();
    },
    [kind],
  );
}

export async function getEditorText(page: Page, options?: Options) {
  const kind = options?.rightEditor ? "secondary" : "main";
  return page.evaluate(
    ([kind]) => {
      const editor: editorApi.IStandaloneCodeEditor = window.monacoApi[kind as Kind];
      return editor.getValue();
    },
    [kind],
  );
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
  return page.evaluate(() => !!document.querySelector(".search-highlight"));
}

// A tricky way to write to the clipboard. see:
// - https://github.com/microsoft/playwright/issues/8114
// - https://github.com/microsoft/playwright/issues/13037
// NOTICE: It needs to be used before focusing on an element to avoid losing focus after writing to the clipboard.
export async function writeToClipboard(page: Page, text: string) {
  await page.evaluate(() => {
    const dummy = document.createElement("textarea");
    dummy.id = "dummy-clipboard";
    dummy.style.position = "absolute";
    dummy.style.top = "0";
    dummy.style.left = "0";
    dummy.style.width = "100";
    dummy.style.height = "100";
    dummy.style.zIndex = "1000";
    document.body.appendChild(dummy);
  });

  await page.locator("#dummy-clipboard").fill(text);
  await page.locator("#dummy-clipboard").focus();
  await page.keyboard.press("ControlOrMeta+A");
  await page.keyboard.press("ControlOrMeta+C");

  await page.evaluate(() => {
    document.body.removeChild(document.querySelector("#dummy-clipboard")!);
  });
}
