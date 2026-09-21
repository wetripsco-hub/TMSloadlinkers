import { test, expect } from './fixtures';

test.describe('Overview', () => {
  test('loads with no console errors and shows the KPI rows', async ({ page, consoleErrors }) => {
    await page.goto('/overview');
    await expect(page.getByRole('heading', { name: 'Operations Overview' })).toBeVisible();
    await expect(page.getByText('Revenue vs. Margin')).toBeVisible();
    await expect(page.getByText('Loads by Status')).toBeVisible();
    expect(consoleErrors, JSON.stringify(consoleErrors, null, 2)).toEqual([]);
  });

  test('header actions navigate to Directory and New Load', async ({ page }) => {
    await page.goto('/overview');
    await page.getByRole('link', { name: /Directory/i }).click();
    await expect(page).toHaveURL(/\/customers$/);

    await page.goto('/overview');
    await page.getByRole('link', { name: /New Load/i }).click();
    // NOTE: the "New Load" header CTA (src/app/(dashboard)/overview/page.tsx)
    // links to /loads, not /loads/new -- likely a mislabeled/miswired href;
    // asserting actual behavior here, flagged separately as a finding.
    await expect(page).toHaveURL(/\/loads$/);
  });
});
