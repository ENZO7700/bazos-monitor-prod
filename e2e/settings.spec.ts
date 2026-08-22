import { test, expect } from "@playwright/test";

test.describe("Settings", () => {
  test("shows PWA and notification sections", async ({ page }) => {
    await page.goto("/settings");

    await expect(page.getByRole("heading", { name: "Nastavenia" })).toBeVisible();
    await expect(page.getByText("Push notifikácie", { exact: true })).toBeVisible();
    await expect(page.getByText("Automatické obnovovanie", { exact: true })).toBeVisible();
    await expect(page.getByText("Inštalácia PWA", { exact: true })).toBeVisible();
    await expect(page.getByRole("link", { name: "Viac informácií" })).toBeVisible();
  });

  test("about page link works", async ({ page }) => {
    await page.goto("/settings");
    await page.getByRole("link", { name: "Viac informácií" }).click();

    await expect(page).toHaveURL("/about");
    await expect(page.getByRole("heading", { name: "O aplikácii" })).toBeVisible();
    await expect(page.getByText("Zdroj dát", { exact: true })).toBeVisible();
    await expect(page.getByText("Súkromie", { exact: true })).toBeVisible();
  });
});
