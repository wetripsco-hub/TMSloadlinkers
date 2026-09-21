import { test, expect } from './fixtures';

function isGated(url: string): boolean {
  return !url.includes('/platform-admin');
}

test.describe('Platform Admin', () => {
  test('dashboard loads with no console errors (or is correctly gated for non-platform-admins)', async ({
    page,
    consoleErrors,
  }) => {
    await page.goto('/platform-admin');

    if (isGated(page.url())) {
      test.info().annotations.push({
        type: 'blocker',
        description: `TEST_USER_EMAIL is not a platform_admin (021_platform_admin.sql); requirePlatformAdmin() redirected to ${page.url()}.`,
      });
      return;
    }

    await expect(page.getByRole('heading', { name: 'Platform Administration' })).toBeVisible();
    expect(consoleErrors, JSON.stringify(consoleErrors, null, 2)).toEqual([]);
  });

  test('organizations, tickets, audit-log, and reset-requests pages are reachable', async ({ page }) => {
    await page.goto('/platform-admin');
    test.skip(isGated(page.url()), 'Test account is not a platform_admin.');

    for (const route of [
      '/platform-admin/organizations',
      '/platform-admin/tickets',
      '/platform-admin/audit-log',
      '/platform-admin/reset-requests',
    ]) {
      await page.goto(route);
      await expect(page).toHaveURL(new RegExp(route.replace(/\//g, '\\/') + '$'));
    }
  });
});
