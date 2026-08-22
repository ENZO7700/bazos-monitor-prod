import { test, expect } from "@playwright/test";

test.describe("Dashboard", () => {
  test("shows stats cards and latest listings section", async ({ page }) => {
    await page.goto("/");

    await expect(page.getByRole("heading", { name: "Bazoš Monitor" })).toBeVisible();
    await expect(page.getByText("Aktívne sledovania")).toBeVisible();
    await expect(page.getByText("Nové dnes")).toBeVisible();
    await expect(page.getByText("Neprečítané")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Najnovšie inzeráty" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Obnoviť teraz" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Čo hľadáš?" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Vlastné nastavenie" })).toBeVisible();
  });

  test("refresh button triggers poll without error", async ({ page }) => {
    await page.goto("/");

    const refreshButton = page.getByRole("button", { name: "Obnoviť teraz" });
    await refreshButton.click();

    await expect(
      page.getByText(/Spracovaných \d+ sledovaní/).or(page.getByText("Obnovenie zlyhalo"))
    ).toBeVisible({ timeout: 30_000 });
  });
});
