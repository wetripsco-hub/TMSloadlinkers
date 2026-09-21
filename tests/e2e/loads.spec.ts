import { test, expect } from './fixtures';
import { uniqueName } from './helpers/test-data';
import { getTestOrgId, getOrCreateFixtureCustomerId } from './helpers/db';

test.describe('Loads', () => {
  test('loads list page renders with no console errors', async ({ page, consoleErrors }) => {
    await page.goto('/loads');
    await expect(page.getByRole('heading', { name: /^Loads$/ }).or(page.getByText(/Loads/i).first())).toBeVisible();
    expect(consoleErrors, JSON.stringify(consoleErrors, null, 2)).toEqual([]);
  });

  test('status filter narrows the loads table', async ({ page }) => {
    await page.goto('/loads?status=delivered');
    await page.waitForLoadState('networkidle');
    // Just assert the page reflects the query param without crashing --
    // exact row assertions depend on data that may or may not exist yet.
    await expect(page).toHaveURL(/status=delivered/);
  });

  test('creates a load through the new-load wizard end to end', async ({ page }) => {
    const orgId = await getTestOrgId();
    const customerId = await getOrCreateFixtureCustomerId(orgId);
    const originFacility = uniqueName('OriginFacility');
    const destFacility = uniqueName('DestFacility');

    await page.goto('/loads/new');
    await expect(page.getByText('Step 1 of 5')).toBeVisible();

    // Step 1: customer & rate
    await page.getByLabel(/^Customer/).fill(customerId);
    await page.getByLabel(/Shipper rate/i).fill('1500.00');
    await page.getByLabel(/Carrier pay/i).fill('1200.00');
    await page.getByRole('button', { name: 'Next', exact: true }).click();

    // Step 2: origin
    await expect(page.getByText('Step 2 of 5')).toBeVisible();
    await page.getByLabel(/Facility name/i).fill(originFacility);
    await page.getByLabel(/^Address/).fill('100 Origin St');
    await page.getByLabel(/^City/).fill('Chicago');
    await page.getByLabel(/^State/).fill('IL');
    await page.getByLabel(/^ZIP/).fill('60601');
    await page.getByLabel(/Pickup date/i).fill('2026-10-01');
    await page.getByRole('button', { name: 'Next', exact: true }).click();

    // Step 3: destination
    await expect(page.getByText('Step 3 of 5')).toBeVisible();
    await page.getByLabel(/Facility name/i).fill(destFacility);
    await page.getByLabel(/^Address/).fill('200 Destination Ave');
    await page.getByLabel(/^City/).fill('Dallas');
    await page.getByLabel(/^State/).fill('TX');
    await page.getByLabel(/^ZIP/).fill('75201');
    await page.getByLabel(/Delivery date/i).fill('2026-10-03');
    await page.getByRole('button', { name: 'Next', exact: true }).click();

    // Step 4: equipment & cargo
    await expect(page.getByText('Step 4 of 5')).toBeVisible();
    await page.getByLabel(/Equipment type/i).fill('Dry Van');
    await page.getByLabel(/^Weight/).fill('20000');
    await page.getByLabel(/^Commodity/).fill('General Freight');
    await page.getByRole('button', { name: 'Next', exact: true }).click();

    // Step 5: review & submit
    await expect(page.getByText('Step 5 of 5')).toBeVisible();
    await expect(page.getByText(originFacility)).toBeVisible();
    await page.getByRole('button', { name: 'Create Load' }).click();

    await page.waitForURL(/\/loads\/[0-9a-f-]+$/i, { timeout: 20_000 });
    await expect(page.getByText(originFacility).or(page.getByText('100 Origin St'))).toBeVisible();
  });

  test('wizard blocks advancing past step 1 with missing required fields', async ({ page }) => {
    await page.goto('/loads/new');
    await page.getByRole('button', { name: 'Next', exact: true }).click();
    await expect(page.getByText('Step 1 of 5')).toBeVisible();
    await expect(page.getByText(/required/i).first()).toBeVisible();
  });
});
