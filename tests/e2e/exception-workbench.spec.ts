import { test, expect } from './fixtures';

// exception-workbench.tsx (src/components/dashboard/exception-workbench.tsx)
// has no standalone route -- it's a conditional widget embedded in the
// Overview page that renders null when there's nothing to flag. Kept as its
// own spec file per the requested module list, but it drives /overview
// (confirmed with the user before writing this).
test.describe('Exception Workbench', () => {
  test('renders on Overview with no console errors, or is correctly absent when all-clear', async ({
    page,
    consoleErrors,
  }) => {
    await page.goto('/overview');
    expect(consoleErrors, JSON.stringify(consoleErrors, null, 2)).toEqual([]);

    const workbench = page.getByText('Needs attention');
    if (!(await workbench.isVisible().catch(() => false))) {
      test.info().annotations.push({
        type: 'note',
        description: 'No exceptions present for this org -- ExceptionWorkbench correctly rendered nothing.',
      });
    }
  });

  test('a flagged tile deep-links into a filtered Loads/Carriers view', async ({ page }) => {
    await page.goto('/overview');
    const workbench = page.getByText('Needs attention');

    test.skip(
      !(await workbench.isVisible().catch(() => false)),
      'No active exceptions for this org right now (all-clear state).'
    );

    const missingCarrierLink = page.getByRole('link', { name: /missing a carrier/i });
    if (await missingCarrierLink.count()) {
      await missingCarrierLink.click();
      await expect(page).toHaveURL(/\/loads\?.*noCarrier=1/);
      return;
    }

    const pendingPodLink = page.getByRole('link', { name: /pending POD/i });
    if (await pendingPodLink.count()) {
      await pendingPodLink.click();
      await expect(page).toHaveURL(/\/loads\?status=delivered&pendingPod=1/);
      return;
    }

    const expiredInsuranceLink = page.getByRole('link', { name: /expired insurance/i });
    if (await expiredInsuranceLink.count()) {
      await expiredInsuranceLink.click();
      await expect(page).toHaveURL(/\/carriers\?insuranceExpired=1/);
      return;
    }

    const expiringInsuranceLink = page.getByRole('link', { name: /insurance expiring soon/i });
    if (await expiringInsuranceLink.count()) {
      await expiringInsuranceLink.click();
      await expect(page).toHaveURL(/\/carriers\?compliance=expiring/);
    }
  });
});
