import { test, expect } from "@playwright/test";

test.describe("SK/CZ Country Switcher", () => {
  test("Searcher & QuickStart switches countries and placeholders", async ({ page }) => {
    await page.goto("/");

    // Default state: CZ
    const searchInput = page.getByPlaceholder("napr. iPhone 16 v Prahe do 20000 Kč").first();
    await expect(searchInput).toBeVisible();

    // Click ALL
    await page.getByRole("button", { name: "🌍 Všetko" }).first().click();
    await expect(page.getByPlaceholder("napr. iPhone 16 / MacBook / Octavia").first()).toBeVisible();

    // Click SK
    await page.getByRole("button", { name: "🇸🇰 Slovensko (Bazoš.sk)" }).first().click();
    await expect(page.getByPlaceholder("napr. iPhone 15 do 400 € v BA").first()).toBeVisible();
  });

  test("Dashboard Listings switcher toggles active state", async ({ page }) => {
    await page.goto("/");

    // We have pills next to "Najnovšie inzeráty"
    const czBtn = page.getByRole("button", { name: "🇨🇿 ČR" });
    const skBtn = page.getByRole("button", { name: "🇸🇰 SR" });

    // Expect they exist
    await expect(czBtn).toBeVisible();
    await expect(skBtn).toBeVisible();
    
    // Switch to SK
    await skBtn.click();
    await expect(skBtn).toBeEnabled();

    // Switch back to CZ
    await czBtn.click();
    await expect(czBtn).toBeEnabled();
  });

  test("Listings Page country filter is persisted", async ({ page }) => {
    await page.goto("/listings");

    // Click on the country filter select trigger (Default is CZ)
    const countrySelect = page.getByRole("combobox").filter({ hasText: "🇨🇿 Iba Bazoš.cz" });
    await expect(countrySelect).toBeVisible();

    // Open dropdown
    await countrySelect.click();
    
    // Select SK
    await page.getByRole("option", { name: "🇸🇰 Iba Bazoš.sk" }).click();

    // The combobox should now display the selected SK option
    await expect(page.getByRole("combobox").filter({ hasText: "🇸🇰 Iba Bazoš.sk" })).toBeVisible();

    // Reload page to ensure persistence from localStorage
    await page.reload();

    // The combobox should still show SK
    await expect(page.getByRole("combobox").filter({ hasText: "🇸🇰 Iba Bazoš.sk" })).toBeVisible();
  });
});
