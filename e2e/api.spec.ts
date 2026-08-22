import { test, expect } from "@playwright/test";
import {
  cleanupE2EWatches,
  createWatchViaApi,
  cronAuthHeaders,
  deleteWatchViaApi,
  uniqueWatchName,
} from "./helpers";

test.describe("API", () => {
  test.afterEach(async ({ request }) => {
    await cleanupE2EWatches(request);
  });

  test("health endpoint returns database status", async ({ request }) => {
    const response = await request.get("/api/health");
    expect(response.ok()).toBeTruthy();

    const body = await response.json();
    expect(body.status).toBe("ok");
    expect(body.database).toBe("connected");
  });

  test("stats endpoint returns expected shape", async ({ request }) => {
    const response = await request.get("/api/stats");
    expect(response.ok()).toBeTruthy();

    const body = await response.json();
    expect(body).toMatchObject({
      activeWatches: expect.any(Number),
      newToday: expect.any(Number),
      unread: expect.any(Number),
    });
  });

  test("watches CRUD lifecycle", async ({ request }) => {
    const name = uniqueWatchName("crud");
    const created = await createWatchViaApi(request, {
      name,
      keywords: ["iphone", "e2e"],
    });

    expect(created.id).toBeTruthy();
    expect(created.name).toBe(name);

    const listResponse = await request.get("/api/watches");
    const watches = await listResponse.json();
    expect(watches.some((w: { id: string }) => w.id === created.id)).toBeTruthy();

    const patchResponse = await request.patch(`/api/watches/${created.id}`, {
      data: { isActive: false },
    });
    expect(patchResponse.ok()).toBeTruthy();
    const patched = await patchResponse.json();
    expect(patched.isActive).toBe(false);

    const deleteResponse = await request.delete(`/api/watches/${created.id}`);
    expect(deleteResponse.ok()).toBeTruthy();

    const afterDelete = await request.get("/api/watches");
    const remaining = await afterDelete.json();
    expect(remaining.some((w: { id: string }) => w.id === created.id)).toBeFalsy();
  });

  test("listings endpoint returns array", async ({ request }) => {
    const response = await request.get("/api/listings?limit=5");
    expect(response.ok()).toBeTruthy();

    const listings = await response.json();
    expect(Array.isArray(listings)).toBeTruthy();
  });

  test("poll endpoint requires authorization when CRON_SECRET is set", async ({
    request,
  }) => {
    test.skip(!process.env.CRON_SECRET, "CRON_SECRET not configured");

    const unauthorized = await request.post("/api/poll");
    expect(unauthorized.status()).toBe(401);

    const authorized = await request.post("/api/poll", {
      headers: cronAuthHeaders(),
    });
    expect(authorized.ok()).toBeTruthy();
  });

  test("cron poll-rss endpoint requires authorization when CRON_SECRET is set", async ({
    request,
  }) => {
    test.skip(!process.env.CRON_SECRET, "CRON_SECRET not configured");

    const unauthorized = await request.get("/api/cron/poll-rss");
    expect(unauthorized.status()).toBe(401);

    const authorized = await request.get("/api/cron/poll-rss", {
      headers: cronAuthHeaders(),
    });
    expect(authorized.ok()).toBeTruthy();
  });

  test("manifest is served", async ({ request }) => {
    const response = await request.get("/manifest.webmanifest");
    expect(response.ok()).toBeTruthy();

    const manifest = await response.json();
    expect(manifest.name).toBe("Bazoš Monitor");
    expect(manifest.icons?.length).toBeGreaterThan(0);
    expect(manifest.screenshots?.length).toBeGreaterThan(0);
  });
});
