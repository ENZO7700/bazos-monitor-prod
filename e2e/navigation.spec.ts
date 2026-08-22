import { test, expect } from "@playwright/test";

const pages = [
  { path: "/", heading: "Bazoš Monitor" },
  { path: "/watches", heading: "Sledovania" },
  { path: "/listings", heading: "Inzeráty" },
  { path: "/phones", heading: "Telefóny" },
  { path: "/settings", heading: "Nastavenia" },
  { path: "/about", heading: "O aplikácii" },
  { path: "/watches/new", heading: "Nové sledovanie" },
  { path: "/~offline", heading: "Si offline" },
];

test.describe("Navigation", () => {
  for (const { path, heading } of pages) {
    test(`loads ${path}`, async ({ page }) => {
      await page.goto(path);
      await expect(page.getByRole("heading", { name: heading, level: 1 })).toBeVisible();
    });
  }

  test("mobile bottom navigation visits main sections", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "mobile", "mobile viewport only");

    await page.goto("/");

    await page.getByRole("navigation").filter({ hasText: "Sledovania" }).getByRole("link", { name: "Sledovania" }).click();
    await expect(page).toHaveURL("/watches");
    await expect(page.getByRole("heading", { name: "Sledovania", level: 1 })).toBeVisible();

    await page.getByRole("navigation").filter({ hasText: "Inzeráty" }).getByRole("link", { name: "Inzeráty" }).click();
    await expect(page).toHaveURL("/listings");

    await page.getByRole("navigation").filter({ hasText: "Nastavenia" }).getByRole("link", { name: "Nastavenia" }).click();
    await expect(page).toHaveURL("/settings");
  });

  test("desktop header navigation works", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "chromium", "desktop viewport only");

    await page.goto("/");

    await page.getByRole("banner").getByRole("link", { name: "Inzeráty" }).click();
    await expect(page).toHaveURL("/listings");

    await page.getByRole("banner").getByRole("link", { name: "Nastavenia" }).click();
    await expect(page).toHaveURL("/settings");
  });
});
