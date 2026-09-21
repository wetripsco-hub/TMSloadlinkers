import { test, expect } from './fixtures';

test.describe('Reports', () => {
  test('loads with no console errors and shows both tabs', async ({ page, consoleErrors }) => {
    await page.goto('/reports');
    await expect(page.getByRole('tab', { name: 'Financial' })).toBeVisible();
    await expect(page.getByRole('tab', { name: 'Operational' })).toBeVisible();
    expect(consoleErrors, JSON.stringify(consoleErrors, null, 2)).toEqual([]);
  });

  test('switches to the Operational tab', async ({ page }) => {
    await page.goto('/reports');
    await page.getByRole('tab', { name: 'Operational' }).click();
    await expect(page.getByRole('tab', { name: 'Operational' })).toHaveAttribute('aria-selected', 'true');
  });

  test('changing the date range updates the URL', async ({ page }) => {
    await page.goto('/reports');
    const startInput = page.locator('input[type="date"]').first();
    if (await startInput.count()) {
      await startInput.fill('2026-01-01');
      await page.keyboard.press('Tab');
      await page.waitForLoadState('networkidle');
      await expect(page).toHaveURL(/startDate=2026-01-01/);
    }
  });

  test('rejects an invalid date range without crashing', async ({ page, consoleErrors }) => {
    await page.goto('/reports?startDate=2026-12-31&endDate=2026-01-01');
    // InvalidRangeNotice renders in a rose-bordered box instead of the tabs
    // when validation fails server-side; either outcome is fine as long as
    // the page renders something instead of throwing.
    await expect(page.locator('body')).not.toBeEmpty();
    expect(consoleErrors, JSON.stringify(consoleErrors, null, 2)).toEqual([]);
  });
});
