/**
 * E2E: Check-in flow
 * Requires: running app + Supabase (supabase db push migration 003)
 * Env: PLAYWRIGHT_TEST_EMAIL, PLAYWRIGHT_TEST_PASSPHRASE
 *
 * Smoke test: login → check-in → persist → refresh → entry visible in timeline
 */

import { test, expect } from "@playwright/test";

const EMAIL = process.env.PLAYWRIGHT_TEST_EMAIL ?? "test@example.com";
const PASSPHRASE = process.env.PLAYWRIGHT_TEST_PASSPHRASE ?? "test-passphrase-32chars-minimum!";

test.describe("Check-in flow", () => {
  test.skip(
    !process.env.PLAYWRIGHT_TEST_EMAIL,
    "Set PLAYWRIGHT_TEST_EMAIL and PLAYWRIGHT_TEST_PASSPHRASE to run"
  );

  test("check-in form renders and saves entry", async ({ page }) => {
    // Navigate to check-in (redirects to login if not authenticated)
    await page.goto("/check-in");

    // Should see passphrase gate or login
    const isLogin = await page.locator(".login-card").isVisible().catch(() => false);
    const isPassphraseGate = await page.locator(".passphrase-card").isVisible().catch(() => false);

    expect(isLogin || isPassphraseGate).toBeTruthy();

    if (isPassphraseGate) {
      // Already logged in via magic link session — just enter passphrase
      await page.fill("input[type='password']", PASSPHRASE);
      await page.click("button[type='submit'], .login-btn");
      await page.waitForSelector(".ci-form", { timeout: 10_000 });
    }

    // Fill sleep section
    await page.fill("#bedtime", "23:00");
    await page.fill("#wakeup", "07:00");
    await page.click('[data-testid="sleep-quality-4"]'); // sleep quality = 4 (Sesja 19 Krok 3: forced 1-4)
    await page.click('label:has-text("nie")'); // no night waking

    // Fill energy
    await page.click('[data-testid="rating-btn-4"]'); // energy = 4 (default testIdPrefix)
    await page.click('label:has-text("wysoka")');

    // Fill mood
    await page.click('label:has-text("wysoki")');

    // Fill intentions
    await page.fill("#intentions", "Dokończę N5 autopilot i sprawdzę build. Zadzwonię o 14:00.");

    // Fill first action
    await page.fill("#firstAction", "Otwieram check-in form i testuję Playwright.");

    // Save
    await page.click(".ci-save-btn");
    await expect(page.locator(".ci-save-btn")).toContainText("Zapisano", { timeout: 8_000 });

    // Refresh — entry should pre-populate (edit mode)
    await page.reload();
    await page.waitForSelector(".ci-form", { timeout: 10_000 });
    await expect(page.locator("#intentions")).toHaveValue(/Dokończę N5/);

    // Check dashboard shows check-in done
    await page.goto("/");
    await page.waitForSelector(".dash-cards", { timeout: 10_000 });
    await expect(page.locator(".dash-card.done")).toHaveCount(1);

    // Timeline shows today's entry
    await page.goto("/timeline");
    await page.waitForSelector(".tl-list", { timeout: 10_000 });
    const todayBadge = page.locator(".tl-badge.done").first();
    await expect(todayBadge).toBeVisible();
  });
});
