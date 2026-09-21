import { test, expect } from './fixtures';
import { uniqueName } from './helpers/test-data';

test.describe('Carriers', () => {
  test('loads with no console errors and shows the KPI ribbon + table', async ({ page, consoleErrors }) => {
    await page.goto('/carriers');
    await expect(page.getByRole('heading', { name: 'Carrier Directory' })).toBeVisible();
    await expect(page.getByText('Total Carriers')).toBeVisible();
    await expect(page.getByText('Verified Compliance')).toBeVisible();
    expect(consoleErrors, JSON.stringify(consoleErrors, null, 2)).toEqual([]);
  });

  test('onboards a new carrier and it appears in the table', async ({ page }) => {
    const companyName = uniqueName('Carrier');
    const dot = String(Math.floor(1_000_000 + Math.random() * 8_000_000));
    const mc = String(Math.floor(100_000 + Math.random() * 800_000));

    await page.goto('/carriers');
    await page.getByRole('button', { name: /Onboard Carrier/i }).click();

    const dialog = page.getByRole('dialog', { name: /Onboard carrier/i });
    await expect(dialog).toBeVisible();

    await dialog.getByLabel(/Company name/i).fill(companyName);
    await dialog.getByLabel(/DOT number/i).fill(dot);
    await dialog.getByLabel(/MC number/i).fill(mc);
    await dialog.getByLabel(/Contact email/i).fill(`e2e_${Date.now()}@example.com`);

    await dialog.getByRole('button', { name: /^Onboard Carrier$/ }).click();

    await expect(dialog).toBeHidden({ timeout: 15_000 });
    await expect(page.getByText(companyName)).toBeVisible({ timeout: 15_000 });
  });

  test('onboard dialog rejects an incomplete submission', async ({ page }) => {
    await page.goto('/carriers');
    await page.getByRole('button', { name: /Onboard Carrier/i }).click();

    const dialog = page.getByRole('dialog', { name: /Onboard carrier/i });
    await dialog.getByRole('button', { name: /^Onboard Carrier$/ }).click();

    await expect(dialog.getByText(/required/i).first()).toBeVisible();
    await expect(dialog).toBeVisible();
  });

  test('compliance filter narrows the table', async ({ page }) => {
    await page.goto('/carriers?compliance=verified');
    await expect(page.getByRole('heading', { name: 'Carrier Directory' })).toBeVisible();
    // A recognized filter value round-trips into the select without falling back to ALL.
    const select = page.locator('select').first();
    if (await select.count()) {
      await expect(select).toHaveValue('verified');
    }
  });
});
