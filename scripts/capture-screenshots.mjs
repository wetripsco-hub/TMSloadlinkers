/**
 * Captures real FreightLink app screenshots for the landing page.
 * Run: node scripts/capture-screenshots.mjs
 *
 * Requires the dev server to be running (npm run dev) and
 * TEST_USER_EMAIL / TEST_USER_PASSWORD in .env.local.
 */

import { chromium } from "playwright";
import { readFileSync, mkdirSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");

dotenv.config({ path: path.resolve(rootDir, ".env.local") });

const BASE_URL = process.env.E2E_BASE_URL ?? "http://localhost:3001";
const EMAIL = process.env.TEST_USER_EMAIL;
const PASSWORD = process.env.TEST_USER_PASSWORD;
const OUT_DIR = path.resolve(rootDir, "public/images/screenshots");

if (!EMAIL || !PASSWORD) {
  console.error("TEST_USER_EMAIL / TEST_USER_PASSWORD not set in .env.local");
  process.exit(1);
}

mkdirSync(OUT_DIR, { recursive: true });

const VIEWPORT = { width: 1440, height: 900 };

async function capture() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: VIEWPORT });
  const page = await context.newPage();

  // Dismiss product tour on first load
  await context.addInitScript(() => {
    window.localStorage.setItem("loadlinkers_tms_tour_completed", "true");
  });

  console.log("Logging in...");
  await page.goto(`${BASE_URL}/login`);
  await page.getByLabel("Work Email").fill(EMAIL);
  await page.locator("#password").fill(PASSWORD);
  await page.getByRole("button", { name: /Sign In to Workspace/i }).click();
  await page.waitForURL((url) => !url.pathname.startsWith("/login"), { timeout: 20000 });
  console.log("  Logged in.");

  const shots = [
    {
      name: "screenshot-dashboard.png",
      url: "/overview",
      label: "Dashboard / Operations overview",
      waitFor: "networkidle",
      clip: null,
    },
    {
      name: "screenshot-loads.png",
      url: "/loads",
      label: "Loads table",
      waitFor: "networkidle",
      clip: null,
    },
    {
      name: "screenshot-load-detail.png",
      url: "/loads",
      label: "Load detail (first load)",
      waitFor: "networkidle",
      clip: null,
      action: async (p) => {
        // Click the load number link in the first row (the <a> in the first tbody tr)
        const loadLink = p.locator("table tbody tr:first-child a").first();
        if (await loadLink.count() > 0) {
          await loadLink.click();
          await p.waitForURL((u) => u.pathname.includes("/loads/"), { timeout: 10000 }).catch(() => {});
          await p.waitForLoadState("networkidle");
          await p.waitForTimeout(1000);
        }
      },
    },
    {
      name: "screenshot-carriers.png",
      url: "/carriers",
      label: "Carrier compliance list",
      waitFor: "networkidle",
      clip: null,
    },
    {
      name: "screenshot-tracking.png",
      url: "/loads",
      label: "Driver tracking (via load detail)",
      waitFor: "networkidle",
      clip: null,
      action: async (p) => {
        // Filter loads to in_transit to find one with driver + GPS data
        const statusSelect = p.locator("select").first();
        if (await statusSelect.count() > 0) {
          await statusSelect.selectOption("in_transit");
          await p.waitForTimeout(800);
        }
        // Click the first load link in the filtered list
        const loadLink = p.locator("table tbody tr:first-child a").first();
        if (await loadLink.count() > 0) {
          await loadLink.click();
          await p.waitForURL((u) => u.pathname.includes("/loads/"), { timeout: 10000 }).catch(() => {});
          await p.waitForLoadState("networkidle");
          await p.waitForTimeout(800);
          // Navigate directly to the /tracking sub-page of this load
          const currentUrl = p.url();
          const loadId = currentUrl.match(/\/loads\/([^/?#]+)/)?.[1];
          if (loadId) {
            await p.goto(`${BASE_URL}/loads/${loadId}/tracking`, { waitUntil: "networkidle" });
          }
        }
      },
    },
  ];

  for (const shot of shots) {
    console.log(`  Capturing: ${shot.label}...`);
    await page.goto(`${BASE_URL}${shot.url}`, { waitUntil: "domcontentloaded" });
    await page.waitForLoadState(shot.waitFor);
    // Short pause for any animations/charts
    await page.waitForTimeout(1200);

    if (shot.action) {
      await shot.action(page);
      await page.waitForTimeout(800);
    }

    const outPath = path.join(OUT_DIR, shot.name);
    await page.screenshot({
      path: outPath,
      ...(shot.clip ? { clip: shot.clip } : { fullPage: false }),
    });
    console.log(`    Saved → ${outPath}`);
  }

  await browser.close();
  console.log("\nDone. Screenshots saved to public/images/screenshots/");
}

capture().catch((err) => {
  console.error(err);
  process.exit(1);
});
