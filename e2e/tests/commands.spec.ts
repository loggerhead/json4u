import { test, expect, type Page } from "@playwright/test";
import { clearEditor, getEditor, getEditorText, getMaxLineNumber } from "../helpers/utils";

async function clickCmd(page: Page, cmd: string) {
  const search = page.locator("#cmd-search");
  await search.click();
  await search.locator("input").fill(cmd);
  await search.getByRole("option").first().click();
}

test.describe("commands", () => {
  test.beforeEach(async ({ page }) => {
    await getEditor(page, { goto: true, needTutorial: true });
  });

  test("open command list", async ({ page }) => {
    const search = page.locator("#cmd-search");
    await search.click();
    await search.getByRole("option").first().hover();
    await page.mouse.wheel(0, 100);
    await expect(page.getByText("Show jq input box")).toBeVisible();
  });

  test("format and minify", async ({ page }) => {
    await expect(await getMaxLineNumber(page)).toBeGreaterThan(1);
    await clickCmd(page, "minify");
    await clickCmd(page, "format");
  });

  test("escape and unescape", async ({ page }) => {
    const editor = await getEditor(page, { textarea: true, goto: true });
    await editor.fill('{ "hello": "world" }', { force: true });

    {
      await clickCmd(page, "escape");
      const text = await getEditorText(page);
      await expect(text.replace(/\s/g, "")).toBe(String.raw`{\"hello\":\"world\"}`);
    }
    {
      await clickCmd(page, "unescape");
      const text = await getEditorText(page);
      await expect(text.replace(/\s/g, "")).toBe('{"hello":"world"}');
    }
  });

  test("sort", async ({ page }) => {
    const editor = await getEditor(page, { textarea: true, goto: true });
    await editor.fill('{ "a": 1, "c": 3, "b": 2 }', { force: true });

    {
      await clickCmd(page, "sort asc");
      const text = await getEditorText(page);
      await expect(text.replace(/\s/g, "")).toBe('{"a":1,"b":2,"c":3}');
    }
    {
      await clickCmd(page, "sort desc");
      const text = await getEditorText(page);
      await expect(text.replace(/\s/g, "")).toBe('{"c":3,"b":2,"a":1}');
    }
  });

  test("convert python dict to json", async ({ page }) => {
    const editor = await getEditor(page, { textarea: true, goto: true });
    await editor.fill("{'a':True}", { force: true });

    await clickCmd(page, "Python dict → JSON");
    const text = await getEditorText(page);
    await expect(text.replace(/\s/g, "")).toBe('{"a":true}');
  });

  test("convert url to json", async ({ page }) => {
    const editor = await getEditor(page, { textarea: true, goto: true });

    {
      await editor.fill("https://json4u.com/editor?foo=bar", { force: true });
      await clickCmd(page, "URL → JSON");
      const text = await getEditorText(page);
      await expect(text.replace(/\s/g, "")).toBe(
        '{"Protocol":"https","Host":"json4u.com","Path":"/editor","Query":{"foo":"bar"}}',
      );
    }

    await clearEditor(page);

    {
      await editor.fill("/editor?foo=bar", { force: true });
      await clickCmd(page, "URL → JSON");
      const text = await getEditorText(page);
      await expect(text.replace(/\s/g, "")).toBe('{"Path":"/editor","Query":{"foo":"bar"}}');
    }
  });

  test("jq", async ({ page }) => {
    await clickCmd(page, "jq");
    await page.locator("#cmd-panel input").fill('."Aidan Gillen".array.[1]');
    await getEditor(page, { rightEditor: true });
    const text = await getEditorText(page, { rightEditor: true });
    await expect(text).toBe('"The Wire"');
  });
});
