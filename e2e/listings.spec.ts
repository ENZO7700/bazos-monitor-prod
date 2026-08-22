import { test, expect } from "@playwright/test";

test.describe("Listings", () => {
  test("shows filters and listing grid or empty state", async ({ page }) => {
    await page.goto("/listings");

    await expect(page.getByRole("heading", { name: "Inzeráty" })).toBeVisible();
    await expect(page.getByRole("combobox")).toBeVisible();
    await expect(page.getByRole("button", { name: /Všetky|Len neprečítané/ })).toBeVisible();

    await expect(
      page.locator("h3").first().or(page.getByText("Žiadne inzeráty pre zvolené filtre."))
    ).toBeVisible({ timeout: 15_000 });
  });

  test("unread filter toggles", async ({ page }) => {
    await page.goto("/listings");

    const filterButton = page.getByRole("button", { name: /Všetky|Len neprečítané/ });
    const initialLabel = await filterButton.textContent();

    await filterButton.click();
    await expect(filterButton).not.toHaveText(initialLabel ?? "");
  });
});
