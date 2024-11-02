import { test, expect } from "@playwright/test";
import { getEditor } from "../helpers/utils";

test("Search command", async ({ page }) => {
  const editor = await getEditor(page, { goto: true });
  await expect(editor).toContainText("Aidan Gillen");
});
