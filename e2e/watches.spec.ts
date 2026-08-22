import { test, expect } from "@playwright/test";
import { cleanupE2EWatches, uniqueWatchName } from "./helpers";

function watchCard(page: import("@playwright/test").Page, watchName: string) {
  return page.locator(".rounded-xl.border").filter({ hasText: watchName });
}

test.describe("Watches", () => {
  test.beforeEach(async ({ request }) => {
    await cleanupE2EWatches(request);
  });

  test.afterEach(async ({ request }) => {
    await cleanupE2EWatches(request);
  });

  test("creates a new watch via form", async ({ page }) => {
    const watchName = uniqueWatchName("form");

    await page.goto("/watches/new");
    await page.getByLabel("Názov").fill(watchName);
    await page.getByLabel("Kľúčové slová (oddelené čiarkou)").fill("e2e, test");
    await page.getByLabel("Min. cena (€)").fill("100");
    await page.getByLabel("Max. cena (€)").fill("500");
    await page.getByRole("button", { name: "Vytvoriť sledovanie" }).click();

    await expect(page).toHaveURL("/watches");
    const card = watchCard(page, watchName);
    await expect(card).toBeVisible();
    await expect(card.getByText("e2e", { exact: true })).toBeVisible();
    await expect(card.getByText("Cena: 100 – 500 €")).toBeVisible();
  });

  test("deletes a watch from the list", async ({ page, request }) => {
    const watchName = uniqueWatchName("delete");
    const createResponse = await request.post("/api/watches", {
      data: { name: watchName, category: "mo", keywords: ["e2e"] },
    });
    const watch = await createResponse.json();

    await page.goto("/watches");
    const card = watchCard(page, watchName);
    await expect(card).toBeVisible();
    await card.getByRole("button", { name: "Zmazať" }).click();

    await expect(watchCard(page, watchName)).toHaveCount(0);

    const listResponse = await request.get("/api/watches");
    const watches = await listResponse.json();
    expect(watches.some((w: { id: string }) => w.id === watch.id)).toBeFalsy();
  });
});
