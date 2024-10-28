import { test, expect } from "@playwright/test";
import { getEditor } from "../helpers/getEditor";

test("tutorial data", async ({ page }) => {
  await page.goto("/editor");
  const editor = await getEditor(page);
  await expect(editor).toContainText("Aidan Gillen");

  // assert graph view has nodes.
  await expect(page.getByTestId("rf__node-$")).toBeVisible();
  await expect(page.getByTestId("rf__node-$/Alexander%20Skarsgard")).toBeVisible();
  await expect(page.getByTestId("rf__node-$/Aidan%20Gillen/array")).toBeVisible();

  const nd = await page.getByTestId("rf__node-$/Aidan%20Gillen");
  await expect(nd).toBeVisible();
  await nd.click();

  // go to root node and assert go to parent button is hidden.
  const goToParentBtn = await page.getByRole("button", { name: "go to parent node" });
  await expect(goToParentBtn).toBeVisible();
  await goToParentBtn.click();
  await expect(goToParentBtn).toBeHidden();

  // no tutorial data when reentry.
  {
    await page.reload();
    const editor = await getEditor(page);
    await expect(editor).toHaveText("");
    await expect(page.getByTestId("rf__node-$")).toBeHidden();
  }
});
