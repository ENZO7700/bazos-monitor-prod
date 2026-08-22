import { test, expect } from "@playwright/test";

test.describe("Agentic browsing readiness", () => {
  test("llms.txt is served with app description", async ({ request }) => {
    const response = await request.get("/llms.txt");
    expect(response.ok()).toBeTruthy();

    const body = await response.text();
    expect(body).toContain("Bazoš Monitor");
    expect(body).toContain("/api/health");
    expect(body).toContain("create_watch");
  });

  test("page has document title, lang, and meta description", async ({ page }) => {
    await page.goto("/");

    await expect(page).toHaveTitle(/Bazoš Monitor/);
    await expect(page.locator("html")).toHaveAttribute("lang", "sk");

    const description = page.locator('meta[name="description"]');
    await expect(description).toHaveAttribute("content", /Bazoš/);
  });

  test("skip link targets main content landmark", async ({ page }) => {
    await page.goto("/");

    const skipLink = page.getByRole("link", { name: "Preskočiť na obsah" });
    await expect(skipLink).toHaveAttribute("href", "#main-content");
    await expect(page.locator("#main-content")).toBeVisible();
  });

  test("active desktop nav link exposes aria-current", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "chromium", "desktop viewport only");

    await page.goto("/watches");
    await expect(
      page.getByRole("banner").getByRole("link", { name: "Sledovania" })
    ).toHaveAttribute("aria-current", "page");
  });

  test("watch form exposes declarative WebMCP tool metadata", async ({ page }) => {
    await page.goto("/watches/new");

    const form = page.locator('form[toolname="create_watch"]');
    await expect(form).toBeVisible();
    await expect(form).toHaveAttribute("tooldescription", /sledovanie/i);

    await expect(page.locator('input[name="name"]')).toHaveAttribute(
      "toolparamdescription",
      /.+/
    );
    await expect(page.locator('input[name="keywords"]')).toHaveAttribute(
      "toolparamdescription",
      /.+/
    );
  });

  test("homepage quick start exposes declarative WebMCP tool metadata", async ({ page }) => {
    await page.goto("/");

    const form = page.locator('form[toolname="quick_start_watch"]');
    await expect(form).toBeVisible();
    await expect(form).toHaveAttribute("tooldescription", /sledovanie/i);

    await expect(page.locator('input[name="query"]')).toHaveAttribute(
      "toolparamdescription",
      /.+/
    );
  });

  test("Permissions-Policy enables WebMCP only with first-party origin trial token", async ({
    request,
  }) => {
    const response = await request.get("/");
    const policy = response.headers()["permissions-policy"] ?? "";
    const token = process.env.NEXT_PUBLIC_WEBMCP_ORIGIN_TRIAL_TOKEN;

    const isThirdParty = (() => {
      if (!token) return false;
      const slash = token.lastIndexOf("/");
      if (slash === -1) return false;
      try {
        const payload = JSON.parse(
          Buffer.from(token.slice(slash + 1), "base64").toString("utf8")
        ) as { isThirdParty?: boolean };
        return payload.isThirdParty === true;
      } catch {
        return false;
      }
    })();

    if (token && !isThirdParty) {
      expect(policy.toLowerCase()).toContain("tools=(self)");
    } else {
      expect(policy.toLowerCase()).not.toContain("tools");
    }
  });
});
