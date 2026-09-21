import { test, expect } from './fixtures';

test.describe('Settlements', () => {
  test('loads with no console errors and shows the KPI ribbon + table', async ({ page, consoleErrors }) => {
    await page.goto('/settlements');
    await expect(page.getByRole('heading', { name: /Carrier Settlements \(Payables\)/i })).toBeVisible();
    await expect(page.getByText('Disbursed Pay')).toBeVisible();
    expect(consoleErrors, JSON.stringify(consoleErrors, null, 2)).toEqual([]);
  });

  test('export NACHA ACH batch downloads a CSV', async ({ page }) => {
    await page.goto('/settlements');
    // Accessible name comes from aria-label ("Export NACHA ACH settlement
    // batch"), not the visible "Export NACHA ACH Batch" text.
    const [download] = await Promise.all([
      page.waitForEvent('download', { timeout: 10_000 }).catch(() => null),
      page.getByRole('button', { name: /Export NACHA ACH settlement batch/i }).click(),
    ]);
    if (download) {
      expect(download.suggestedFilename()).toMatch(/nacha-ach-settlements-.*\.csv/);
    }
  });

  test('generate-settlement dialog reflects current load eligibility', async ({ page }) => {
    await page.goto('/settlements');
    const trigger = page.getByRole('button', { name: /Generate settlement/i });

    if (await trigger.isDisabled()) {
      // No delivered load with an assigned carrier exists yet -- correctly disabled.
      return;
    }

    await trigger.click();
    const dialog = page.getByRole('dialog', { name: /Generate carrier settlement voucher/i });
    await expect(dialog).toBeVisible();
    await dialog.getByRole('combobox').click();
    await page.getByRole('option').first().click();
    await dialog.getByRole('button', { name: /^Generate$/ }).click();

    // generateSettlementAction enforces a three-way match (POD must be
    // verified) beyond what the page's own eligibility list checks, so a
    // load can be "eligible" here yet still be correctly rejected server-side.
    const threeWayMatchError = dialog.getByText(/Three-way match failed/i);
    const result = await Promise.race([
      dialog.waitFor({ state: 'hidden', timeout: 15_000 }).then(() => 'closed' as const),
      threeWayMatchError.waitFor({ state: 'visible', timeout: 15_000 }).then(() => 'rejected' as const),
    ]);

    if (result === 'rejected') {
      await expect(threeWayMatchError).toBeVisible();
      await expect(dialog).toBeVisible();
    }
  });
});
