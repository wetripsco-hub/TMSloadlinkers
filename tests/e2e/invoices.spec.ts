import { test, expect } from './fixtures';

test.describe('Invoices', () => {
  test('loads with no console errors and shows the KPI ribbon + table', async ({ page, consoleErrors }) => {
    await page.goto('/invoices');
    await expect(page.getByRole('heading', { name: /Invoices \(Accounts Receivable\)/i })).toBeVisible();
    await expect(page.getByText('Total Invoiced')).toBeVisible();
    expect(consoleErrors, JSON.stringify(consoleErrors, null, 2)).toEqual([]);
  });

  test('sync-to-QuickBooks button flips to a synced state', async ({ page }) => {
    await page.goto('/invoices');
    // Accessible name comes from the button's aria-label, not its visible
    // "Sync to QuickBooks" text -- the label doesn't contain that phrase
    // verbatim ("Sync ledger data to QuickBooks Online"), so match on that.
    const button = page.getByRole('button', { name: /Sync ledger data to QuickBooks Online/i });
    await button.click();
    await expect(page.getByText('Synced to QuickBooks')).toBeVisible({ timeout: 5_000 });
  });

  test('generate-invoice dialog reflects current load eligibility', async ({ page }) => {
    await page.goto('/invoices');
    await page.getByRole('button', { name: /Generate invoice/i }).click();

    const dialog = page.getByRole('dialog', { name: /Generate shipper invoice/i });
    await expect(dialog).toBeVisible();

    // The dialog fetches the real eligible-loads list on open
    // (listInvoiceEligibleLoadsAction); wait for that to settle before
    // branching, otherwise the loading placeholder gets mistaken for either
    // final state.
    await expect(dialog.getByText(/Loading eligible loads/i)).toBeHidden({ timeout: 10_000 }).catch(() => {});

    const noEligible = dialog.getByText(/No loads currently need a shipper invoice/i);
    const generateButton = dialog.getByRole('button', { name: /^Generate$/ });

    if (await noEligible.isVisible().catch(() => false)) {
      await expect(generateButton).toBeDisabled();
    } else {
      // There's at least one eligible load -- exercise the real generate path.
      await dialog.getByRole('combobox').click();
      await page.getByRole('option').first().click();
      await generateButton.click();
      await expect(dialog).toBeHidden({ timeout: 15_000 });
    }
  });
});
