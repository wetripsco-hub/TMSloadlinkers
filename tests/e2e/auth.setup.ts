import { test as setup, expect } from '@playwright/test';

const authFile = 'tests/e2e/.auth/user.json';

setup('authenticate', async ({ page }) => {
  const email = process.env.TEST_USER_EMAIL;
  const password = process.env.TEST_USER_PASSWORD;

  if (!email || !password) {
    throw new Error(
      'TEST_USER_EMAIL / TEST_USER_PASSWORD are not set. Add them to .env.local ' +
        'and run tests with `npm run test:e2e` (which loads .env.local via dotenv-cli).'
    );
  }

  await page.goto('/login');
  await page.getByLabel('Work Email').fill(email);
  await page.locator('#password').fill(password);
  await page.getByRole('button', { name: /Sign In to Workspace/i }).click();

  // Successful login redirects out of /login into the dashboard shell.
  await page.waitForURL((url) => !url.pathname.startsWith('/login'), { timeout: 15_000 });
  await expect(page.locator('body')).not.toContainText('Sign in to your account');

  // ProductTour (components/onboarding/product-tour.tsx) shows a full-screen
  // welcome walkthrough on first dashboard load and intercepts every click
  // until dismissed. Mark it completed up front so it doesn't appear (and
  // block interactions) in every spec that reuses this storageState.
  await page.evaluate(() => {
    window.localStorage.setItem('loadlinkers_tms_tour_completed', 'true');
  });

  await page.context().storageState({ path: authFile });
});
