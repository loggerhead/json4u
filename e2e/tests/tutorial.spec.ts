import { test, expect } from "@playwright/test";
import { getEditor, getGraphNode } from "../helpers/utils";

test("tutorial data", async ({ page }) => {
  {
    const editor = await getEditor(page, { goto: true, needTutorial: true });
    await expect(editor).toContainText("Aidan Gillen");
  }

  // assert graph view has nodes.
  await expect(getGraphNode(page, "$")).toBeVisible();
  await expect(getGraphNode(page, "$/Alexander%20Skarsgard")).toBeVisible();
  await expect(getGraphNode(page, "$/Aidan%20Gillen/array")).toBeVisible();

  // no tutorial data when reentry.
  {
    const editor = await getEditor(page, { goto: true });
    await expect(editor).toHaveText("");
    await expect(getGraphNode(page, "$")).toBeHidden();
  }
});
