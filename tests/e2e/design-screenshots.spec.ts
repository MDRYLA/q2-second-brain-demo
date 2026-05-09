import { test } from "@playwright/test";
import path from "path";
import fs from "fs";

const VARIANTS = ["v1", "v2", "v3", "v4", "v5"] as const;

test.describe("Design variant screenshots", () => {
  VARIANTS.forEach((v) => {
    test(`screenshot ${v}`, async ({ page }) => {
      const screenshotsDir = path.join(process.cwd(), "docs/design/screenshots");
      fs.mkdirSync(screenshotsDir, { recursive: true });

      await page.goto(`/design/${v}`);
      await page.waitForLoadState("networkidle");
      await page.screenshot({
        path: path.join(screenshotsDir, `${v}.png`),
        fullPage: true,
      });
    });
  });
});
