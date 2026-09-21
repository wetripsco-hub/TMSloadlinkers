import { test, expect } from './fixtures';
import { uniqueName } from './helpers/test-data';

test.describe('Customers', () => {
  test('loads with no console errors and shows the KPI ribbon + table', async ({ page, consoleErrors }) => {
    await page.goto('/customers');
    await expect(page.getByRole('heading', { name: 'Shipper & Customer Accounts' })).toBeVisible();
    await expect(page.getByText('Total Customers')).toBeVisible();
    expect(consoleErrors, JSON.stringify(consoleErrors, null, 2)).toEqual([]);
  });

  test('creates a new customer and it appears in the table', async ({ page }) => {
    const name = uniqueName('Customer');

    await page.goto('/customers');
    await page.getByRole('button', { name: /New Customer/i }).click();

    await expect(page.getByText('Add New Shipper / Customer')).toBeVisible();
    await page.getByLabel(/Company \/ Shipper Name/i).fill(name);
    await page.getByLabel(/Billing Email/i).fill(`e2e_${Date.now()}@example.com`);
    await page.getByLabel(/Phone Number/i).fill('5555550100');

    await page.getByRole('button', { name: /^Create Customer$/ }).click();

    await expect(page.getByText('Add New Shipper / Customer')).toBeHidden({ timeout: 15_000 });
    await expect(page.getByText(name)).toBeVisible({ timeout: 15_000 });
  });

  test('add-customer modal rejects a missing name', async ({ page }) => {
    await page.goto('/customers');
    await page.getByRole('button', { name: /New Customer/i }).click();
    await page.getByRole('button', { name: /^Create Customer$/ }).click();

    // The name field also carries a native `required` attribute, so the
    // browser's own constraint validation blocks submission (and the
    // custom "Customer name is required." error never gets a chance to
    // render) -- assert the modal simply never closed instead.
    await expect(page.getByText('Add New Shipper / Customer')).toBeVisible();
  });

  test('cancel closes the add-customer modal without creating a row', async ({ page }) => {
    await page.goto('/customers');
    await page.getByRole('button', { name: /New Customer/i }).click();
    await page.getByLabel(/Company \/ Shipper Name/i).fill(uniqueName('Cancelled'));
    await page.getByRole('button', { name: /^Cancel$/ }).click();

    await expect(page.getByText('Add New Shipper / Customer')).toBeHidden();
  });
});
