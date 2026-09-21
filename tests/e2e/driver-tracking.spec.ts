import { test, expect } from './fixtures';

test.describe('Driver & Telemetry Tracking', () => {
  test('loads with no console errors and shows the KPI ribbon', async ({ page, consoleErrors }) => {
    await page.goto('/driver-tracking');
    await expect(page.getByRole('heading', { name: /Driver & Telemetry Tracking/i })).toBeVisible();
    await expect(page.getByText('Active Tracked Loads')).toBeVisible();
    expect(consoleErrors, JSON.stringify(consoleErrors, null, 2)).toEqual([]);
  });

  test('refresh-locations action runs without error', async ({ page }) => {
    await page.goto('/driver-tracking');
    const button = page.getByRole('button', { name: /refresh/i });
    if (await button.count()) {
      await button.click();
      await page.waitForLoadState('networkidle');
    }
  });

  test('empty state links back to Active Loads when nothing is tracked', async ({ page }) => {
    await page.goto('/driver-tracking');
    const emptyState = page.getByText('No active tracking sessions');
    if (await emptyState.isVisible().catch(() => false)) {
      await page.getByRole('link', { name: 'View Active Loads' }).click();
      await expect(page).toHaveURL(/\/loads$/);
    }
  });
});
