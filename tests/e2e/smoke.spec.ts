/**
 * E2E smoke tests — no authentication required.
 * Verify that public pages render without crashes and protected routes redirect to login.
 *
 * Run: npm run test:e2e (uses webServer auto-start)
 *      OR PLAYWRIGHT_BASE_URL=https://q2-second-brain-demo.vercel.app npm run test:e2e
 */

import { test, expect } from "@playwright/test";

test.describe("Public smoke", () => {
  test("/login renders", async ({ page }) => {
    await page.goto("/login");
    await expect(page.locator(".login-card")).toBeVisible();
    await expect(page.locator(".login-title")).toContainText("Q2");
  });
});

test.describe("Protected routes redirect to /login when not authenticated", () => {
  for (const path of [
    "/",
    "/check-in",
    "/check-out",
    "/konstytucja",
    "/o-mnie-teraz",
    "/timeline",
    "/pomysly",
    "/plan",
    "/plan/tydzien",
    "/plan/dzien",
    "/plan/miesiac",
    "/plan/kwartal",
    "/plan/rok",
    "/ustawienia/ikony",
    "/cytaty",
    "/silownia",
    "/wiedza",
    "/journal",
  ]) {
    test(`${path} → redirect /login`, async ({ page }) => {
      await page.goto(path);
      await expect(page).toHaveURL(/\/login/);
    });
  }
});
