import path from 'node:path';
import dotenv from 'dotenv';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { test, expect } from './fixtures';
import { E2E_PREFIX } from './helpers/test-data';

dotenv.config({ path: path.resolve(__dirname, '../../.env.local') });

// Verifies P8's platform-admin org suspension + read-only preview feature
// end-to-end: status column/actions render, suspending a real (disposable)
// org blocks that org's own member at the middleware, reactivating restores
// it, and a preview session writes/closes its platform_admin_access_log row
// without exposing any mutation control. This creates and tears down its
// own throwaway org + user (tagged E2E_PREFIX) rather than reusing the
// shared TEST_USER fixture org, since suspending that org would break every
// other spec that depends on it being active.

function adminClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY must be set for e2e fixtures.');
  }
  return createClient(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } });
}

const stamp = `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
const TEMP_ORG_NAME = `${E2E_PREFIX}SuspendOrg_${stamp}`;
const TEMP_USER_EMAIL = `e2e_test_suspend_${stamp}@example.com`;
const TEMP_USER_PASSWORD = 'TempPass123!Suspend';

let tempOrgId: string;
let tempUserId: string;

test.describe.serial('Platform admin: org suspension + preview', () => {
  test.beforeAll(async () => {
    const supabase = adminClient();

    const { data: org, error: orgError } = await supabase
      .from('organizations')
      .insert({ name: TEMP_ORG_NAME, workspace_type: 'freight_brokerage' })
      .select('id')
      .single();
    if (orgError) throw orgError;
    tempOrgId = org.id;

    const { data: userData, error: userError } = await supabase.auth.admin.createUser({
      email: TEMP_USER_EMAIL,
      password: TEMP_USER_PASSWORD,
      email_confirm: true,
    });
    if (userError) throw userError;
    tempUserId = userData.user.id;

    // handle_new_auth_user() (001_foundation.sql) already inserted a bare
    // profiles row for this new auth user; give it the temp org and 'owner'
    // so login lands unconditionally on /overview (isModuleAllowed short-
    // circuits for owner), keeping this test about suspension gating, not
    // module permissions.
    const { error: profileError } = await supabase
      .from('profiles')
      .update({ org_id: tempOrgId, role: 'owner', full_name: 'E2E Suspend Test' })
      .eq('id', tempUserId);
    if (profileError) throw profileError;
  });

  test.afterAll(async () => {
    const supabase = adminClient();
    if (tempUserId) {
      await supabase.auth.admin.deleteUser(tempUserId);
    }
    if (tempOrgId) {
      await supabase.from('organizations').delete().eq('id', tempOrgId);
    }
  });

  test('organizations list renders the status column and row actions', async ({ page }) => {
    await page.goto('/platform-admin/organizations');
    if (page.url().endsWith('/overview')) {
      test.skip(true, 'TEST_USER_EMAIL is not a platform_admin; requirePlatformAdmin() redirected away.');
    }

    await expect(page.getByText('Account status')).toBeVisible();

    await page.getByPlaceholder('Search organizations...').fill(TEMP_ORG_NAME);
    const row = page.locator('tr', { hasText: TEMP_ORG_NAME });
    await expect(row).toBeVisible();
    await expect(row.getByText('Active', { exact: true })).toBeVisible();
    await expect(row.getByRole('button', { name: 'Suspend' })).toBeVisible();
    await expect(row.getByRole('link', { name: 'Preview' })).toBeVisible();
  });

  test('suspending the org blocks that org member at sign-in', async ({ page, browser }) => {
    await page.goto('/platform-admin/organizations');
    if (page.url().endsWith('/overview')) {
      test.skip(true, 'TEST_USER_EMAIL is not a platform_admin.');
    }

    await page.getByPlaceholder('Search organizations...').fill(TEMP_ORG_NAME);
    const row = page.locator('tr', { hasText: TEMP_ORG_NAME });
    await row.getByRole('button', { name: 'Suspend' }).click();

    await page.getByLabel('Reason').fill('E2E test suspension');
    await page.getByRole('button', { name: 'Suspend organization' }).click();

    await expect(row.getByText('Suspended', { exact: true })).toBeVisible({ timeout: 10_000 });
    await expect(row.getByText('E2E test suspension')).toBeVisible();

    // Separate, unauthenticated browser context for the blocked org member --
    // must not share the platform admin's storageState/cookies.
    const memberContext = await browser.newContext();
    const memberPage = await memberContext.newPage();
    await memberPage.goto('/login');
    await memberPage.getByLabel('Work Email').fill(TEMP_USER_EMAIL);
    await memberPage.locator('#password').fill(TEMP_USER_PASSWORD);
    await memberPage.getByRole('button', { name: /Sign In to Workspace/i }).click();

    await memberPage.waitForURL((url) => url.pathname === '/suspended', { timeout: 15_000 });
    await expect(memberPage.getByRole('heading', { name: /account is suspended/i })).toBeVisible();

    await memberContext.close();
  });

  test('reactivating the org restores sign-in for that member', async ({ page, browser }) => {
    await page.goto('/platform-admin/organizations');
    if (page.url().endsWith('/overview')) {
      test.skip(true, 'TEST_USER_EMAIL is not a platform_admin.');
    }

    await page.getByPlaceholder('Search organizations...').fill(TEMP_ORG_NAME);
    const row = page.locator('tr', { hasText: TEMP_ORG_NAME });
    await row.getByRole('button', { name: 'Reactivate' }).click();
    await expect(row.getByText('Active', { exact: true })).toBeVisible({ timeout: 10_000 });

    const memberContext = await browser.newContext();
    const memberPage = await memberContext.newPage();
    await memberPage.goto('/login');
    await memberPage.getByLabel('Work Email').fill(TEMP_USER_EMAIL);
    await memberPage.locator('#password').fill(TEMP_USER_PASSWORD);
    await memberPage.getByRole('button', { name: /Sign In to Workspace/i }).click();

    await memberPage.waitForURL((url) => !url.pathname.startsWith('/login'), { timeout: 15_000 });
    expect(memberPage.url()).not.toContain('/suspended');

    await memberContext.close();
  });

  test('org preview renders a read-only shell and logs the session', async ({ page }) => {
    await page.goto('/platform-admin/organizations');
    if (page.url().endsWith('/overview')) {
      test.skip(true, 'TEST_USER_EMAIL is not a platform_admin.');
    }

    await page.getByPlaceholder('Search organizations...').fill(TEMP_ORG_NAME);
    const row = page.locator('tr', { hasText: TEMP_ORG_NAME });
    await row.getByRole('link', { name: 'Preview' }).click();

    await page.waitForURL(/\/platform-admin\/organizations\/.+\/preview$/);
    await expect(page.getByText(`Viewing as ${TEMP_ORG_NAME} — read only`)).toBeVisible();
    await expect(page.getByText(/Session ends in \d+:\d{2}/)).toBeVisible();

    // No mutation entry points in the preview content area: none of the
    // interactive app's write-side controls (onboard carrier, new load,
    // suspend/reactivate) or a <form> should be present in <main>.
    const main = page.locator('main');
    await expect(main.getByRole('button', { name: /onboard carrier/i })).toHaveCount(0);
    await expect(main.getByRole('link', { name: /new load/i })).toHaveCount(0);
    await expect(main.getByRole('button', { name: /suspend|reactivate/i })).toHaveCount(0);
    expect(await main.locator('form').count()).toBe(0);

    const supabase = adminClient();
    const { data: logRows, error } = await supabase
      .from('platform_admin_access_log')
      .select('id, started_at, ended_at')
      .eq('target_org_id', tempOrgId)
      .order('started_at', { ascending: false })
      .limit(1);
    if (error) throw error;

    expect(logRows).toHaveLength(1);
    const logRow = logRows![0];
    expect(logRow.started_at).toBeTruthy();
    expect(logRow.ended_at).toBeNull();

    // Navigate away to unmount OrgPreviewBanner, which calls endOrgPreview()
    // in its cleanup -- this is the "manually end it" path, since waiting
    // out the real 15-minute session timer isn't practical in a spec.
    await page.goto('/platform-admin/organizations');

    await expect
      .poll(
        async () => {
          const { data } = await supabase
            .from('platform_admin_access_log')
            .select('ended_at')
            .eq('id', logRow.id)
            .maybeSingle();
          return data?.ended_at ?? null;
        },
        { timeout: 10_000 }
      )
      .not.toBeNull();
  });
});
