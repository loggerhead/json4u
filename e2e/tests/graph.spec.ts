import { type Page, test, expect } from "@playwright/test";
import { getEditor, getGraphNode, importJsonFile } from "../helpers/utils";

async function move(page: Page, right: number, down: number) {
  const { x, y, width, height } = (await page.getByTestId("rf__wrapper").boundingBox())!;

  // TODO: mouse down event may click on node which makes viewport unchanged and fall into an infinite loop
  while (right > 0 || down > 0) {
    const dx = Math.max(Math.floor(Math.min(width, right)), 0);
    const dy = Math.max(Math.floor(Math.min(down, height)), 0);

    if (dx == 0 || dy == 0) {
      break;
    }

    await page.mouse.move(x + dx - 1, y + dy - 1);
    await page.mouse.down();
    await page.mouse.move(x + 1, y + 1);
    await page.mouse.up();

    right -= dx;
    down -= dy;
  }
}

test.describe("Virtual graph", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/editor");
  });

  test("check node visible", async ({ page }) => {
    await getEditor(page, { goto: true });
    await importJsonFile(page, "complex.txt");

    await move(page, 2000, 2000);
    await expect(getGraphNode(page, "$")).toBeHidden();
  });

  test("it should render popover when a key node is hovered by mouse.", async ({ page }) => {
    await getEditor(page, { goto: true });

    const keyNode = page.locator(".graph-k");
    const box = await keyNode.first().boundingBox();

    expect(box).toBeTruthy();
    await page.mouse.move(box!.x, box!.y);
    await expect(page.getByTestId("popover-key").first()).toBeVisible();
  });

  test("it should render popover when a value node is hovered by mouse.", async ({ page }) => {
    await getEditor(page, { goto: true });

    const valueNode = page.locator(".graph-v");
    const box = await valueNode.first().boundingBox();

    expect(box).toBeTruthy();
    await page.mouse.move(box!.x, box!.y);
    await expect(page.getByTestId("popover-value").first()).toBeVisible();
  });
});
