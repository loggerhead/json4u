import { type Page, test, expect } from "@playwright/test";
import { getEditor, getGraphNode, hasHighlight, importJsonFile } from "../helpers/utils";

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

test.describe("graph", () => {
  test.beforeEach(async ({ page }) => {
    await getEditor(page, { goto: true, needTutorial: true });
    // wait for the graph to finish rendering
    await expect(getGraphNode(page, "$")).toBeVisible();
  });

  test("lazy load nodes", async ({ page }) => {
    await importJsonFile(page, "complex.txt");
    await move(page, 2000, 2000);
    await expect(getGraphNode(page, "$")).toBeHidden();
  });

  test("toolbar actions", async ({ page }) => {
    // display toolbar when click node
    {
      const nd = await getGraphNode(page, "$/Aidan%20Gillen");
      await expect(nd).toBeVisible();
      await nd.click();
    }

    // fold and unfold node
    {
      await expect(getGraphNode(page, "$/Aidan%20Gillen/array")).toBeVisible();
      await expect(getGraphNode(page, "$/Aidan%20Gillen/object")).toBeVisible();
      await page.getByRole("button", { name: "fold node" }).click();
      await expect(getGraphNode(page, "$/Aidan%20Gillen/array")).toBeHidden();
      await expect(getGraphNode(page, "$/Aidan%20Gillen/object")).toBeHidden();
      await page.getByRole("button", { name: "unfold node" }).click();
      await expect(getGraphNode(page, "$/Aidan%20Gillen/array")).toBeVisible();
      await expect(getGraphNode(page, "$/Aidan%20Gillen/object")).toBeVisible();
    }

    // fold and unfold siblings
    {
      const nd = await getGraphNode(page, "$/Amy%20Ryan");
      await expect(nd).toBeVisible();
      await nd.click();

      await page.getByRole("button", { name: "fold siblings" }).click();
      const nodes = page.locator(".react-flow__node");
      await expect(page.locator(".react-flow__node")).toHaveCount(8);

      await page.getByRole("button", { name: "unfold siblings" }).click();
      await expect(page.locator(".react-flow__node")).toHaveCount(12);
    }

    // go to parent
    {
      await page.getByRole("button", { name: "go to parent node" }).click();

      // root node only have one button
      const buttons = page.locator(".react-flow__node-toolbar").getByRole("button");
      await expect(buttons).toHaveCount(1);
      const btn = buttons.nth(0);
      await expect(btn).toHaveAttribute("title", "fold node");
    }
  });

  test("search", async ({ page }) => {
    // no virtual nodes case
    {
      // type the text into the search input
      const searchInput = page.locator("#view-search");
      await searchInput.click();
      await searchInput.locator("input").fill("null check");

      // select the first option
      await expect(searchInput.getByRole("option").first()).toBeVisible();
      await page.keyboard.press("ArrowDown");
      await page.keyboard.press("Enter");

      // assert that the node is selected and one of its values is highlighted
      {
        await expect(page.getByRole("treeitem", { selected: true })).toHaveAttribute(
          "data-tree-id",
          "$/Aidan%20Gillen",
        );
        const isHl = await hasHighlight(page);
        await expect(isHl).toBe(true);
      }

      // assert that another node is selected and exactly one node is selected
      {
        await getGraphNode(page, "$/Aidan%20Gillen/object").click();
        const node = page.getByRole("treeitem", { selected: true });
        await expect(node).toHaveCount(1);
        await expect(node).toHaveAttribute("data-tree-id", "$/Aidan%20Gillen/object");
        const isHl = await hasHighlight(page);
        await expect(isHl).toBe(true);
      }
    }

    // has virtual nodes case
    {
      await importJsonFile(page, "complex.txt");
      // type the text into the search input
      const searchInput = page.locator("#view-search");
      await searchInput.click();
      await searchInput.locator("input").fill("987654321123456789");

      // select the first option
      await expect(searchInput.getByRole("option").first()).toBeVisible();
      await page.keyboard.press("ArrowDown");
      await page.keyboard.press("Enter");

      // assert that the node is selected and one of its values is highlighted
      await expect(page.getByRole("treeitem", { selected: true })).toHaveCount(1);
      const isHl = await hasHighlight(page);
      await expect(isHl).toBe(true);
    }
  });

  test("popover", async ({ page }) => {
    {
      // it should render popover when a key node is hovered by mouse.
      const box = (await page.locator(".graph-k").first().boundingBox())!;
      await expect(box).toBeTruthy();
      await page.mouse.move(box.x + 3, box.y + 3);
      await expect(page.getByTestId("graph-popover").first()).toBeVisible();
    }

    {
      // it should render popover when a value node is hovered by mouse.
      const box = (await page.locator(".graph-v").first().boundingBox())!;
      await expect(box).toBeTruthy();
      await page.mouse.move(box.x + 3, box.y + 3);
      await expect(page.getByTestId("graph-popover").first()).toBeVisible();
    }
  });
});
