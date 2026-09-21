import { test, expect } from './fixtures';

// No "Load Activity Feed" / messenger component exists in this codebase.
// The closest real feature is (dashboard)/messages -- driver check-in
// notes and dispatch replies threaded per load -- so this spec targets that
// instead of a fictional route (confirmed with the user before writing it).
test.describe('Messages', () => {
  test('loads with no console errors', async ({ page, consoleErrors }) => {
    await page.goto('/messages');
    await expect(page.getByRole('heading', { name: 'Messages' })).toBeVisible();
    expect(consoleErrors, JSON.stringify(consoleErrors, null, 2)).toEqual([]);
  });

  test('shows an empty state or thread list, and a thread deep-links into its load', async ({ page }) => {
    await page.goto('/messages');

    const emptyState = page.getByText('No messages yet');
    if (await emptyState.isVisible().catch(() => false)) {
      return;
    }

    // Scoped to <main> -- the dashboard sidebar also renders "ul > li a"
    // navigation, and an unscoped locator matches that first.
    const firstThread = page.locator('main ul > li a').first();
    await expect(firstThread).toBeVisible();
    await firstThread.click();
    await expect(page).toHaveURL(/\/loads\/[0-9a-f-]+#load-notes-panel/i);
  });
});
