import { test, expect } from './fixtures';

test.describe('Team & Permissions', () => {
  test('loads with no console errors (or is correctly gated for non-admins)', async ({ page, consoleErrors }) => {
    await page.goto('/settings/team');

    if (page.url().endsWith('/overview')) {
      // getAdminContext() redirects non-admin/owner members away -- correct
      // behavior for the test account's role, not a failure.
      test.info().annotations.push({
        type: 'blocker',
        description: 'TEST_USER_EMAIL is not an org admin/owner; /settings/team redirected to /overview.',
      });
      return;
    }

    await expect(page.getByText('Invite a member')).toBeVisible();
    expect(consoleErrors, JSON.stringify(consoleErrors, null, 2)).toEqual([]);
  });

  test('invites a member with module access and can revoke the invite', async ({ page }) => {
    await page.goto('/settings/team');
    if (page.url().endsWith('/overview')) {
      test.skip(true, 'Test account is not an org admin/owner.');
    }

    const email = `e2e_test_${Date.now()}@example.com`;
    await page.getByPlaceholder('teammate@company.com').fill(email);
    await page.getByRole('button', { name: /Send Invitation/i }).click();

    await expect(page.getByText(/Invite created:/i)).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText(email)).toBeVisible();

    const inviteRow = page.locator('li', { hasText: email });
    await inviteRow.getByRole('button', { name: /Revoke/i }).click();
    await expect(page.getByText(email)).toBeHidden({ timeout: 10_000 });
  });

  test('invite requires at least one module for non-owner roles', async ({ page }) => {
    await page.goto('/settings/team');
    if (page.url().endsWith('/overview')) {
      test.skip(true, 'Test account is not an org admin/owner.');
    }

    const checkboxes = page.locator('input[type="checkbox"]');
    const count = await checkboxes.count();
    for (let i = 0; i < count; i++) {
      if (await checkboxes.nth(i).isChecked()) {
        await checkboxes.nth(i).uncheck({ force: true });
      }
    }

    // The submit button itself disables when no module is selected
    // (team-panel.tsx), rather than allowing a click that surfaces a
    // runtime validation message.
    await page.getByPlaceholder('teammate@company.com').fill(`e2e_test_${Date.now()}@example.com`);
    await expect(page.getByRole('button', { name: /Send Invitation/i })).toBeDisabled();
  });
});
