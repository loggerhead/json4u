import { test, expect } from "@playwright/test";
import { getEditor, getGraphNode } from "../helpers/utils";

test("tutorial data", async ({ page }) => {
  {
    const editor = await getEditor(page, { goto: true });
    await expect(editor).toContainText("Aidan Gillen");
  }

  // assert graph view has nodes.
  await expect(getGraphNode(page, "$")).toBeVisible();
  await expect(getGraphNode(page, "$/Alexander%20Skarsgard")).toBeVisible();
  await expect(getGraphNode(page, "$/Aidan%20Gillen/array")).toBeVisible();

  const nd = await getGraphNode(page, "$/Aidan%20Gillen");
  await expect(nd).toBeVisible();
  await nd.click();

  // go to root node and assert go to parent button is hidden.
  const goToParentBtn = await page.getByRole("button", { name: "go to parent node" });
  await expect(goToParentBtn).toBeVisible();
  await goToParentBtn.click();
  await expect(goToParentBtn).toBeHidden();

  // no tutorial data when reentry.
  {
    const editor = await getEditor(page, { goto: true });
    await expect(editor).toHaveText("");
    await expect(getGraphNode(page, "$")).toBeHidden();
  }
});
