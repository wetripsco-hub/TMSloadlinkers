import path from 'node:path';
import dotenv from 'dotenv';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { E2E_PREFIX } from './test-data';

dotenv.config({ path: path.resolve(__dirname, '../../../.env.local') });

// A handful of wizard/dialog fields (loads.customerId, loads.carrierId) take
// a raw row ID rather than exposing a picker the UI itself can drive, and
// customers/carriers have no detail route to read an ID back off. Rather
// than guess a fake UUID, these helpers use the service role (same
// disposable dev project the app itself points at) purely to read/seed the
// fixture IDs a spec needs before driving the real UI flow.
let adminClient: SupabaseClient | null = null;

function admin(): SupabaseClient {
  if (adminClient) return adminClient;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY must be set for e2e fixtures.');
  }
  adminClient = createClient(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } });
  return adminClient;
}

export async function getTestOrgId(): Promise<string> {
  const email = process.env.TEST_USER_EMAIL;
  if (!email) throw new Error('TEST_USER_EMAIL is not set.');

  const supabase = admin();
  let userId: string | null = null;
  for (let page = 1; ; page++) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw error;
    const found = data.users.find((u) => u.email === email);
    if (found) {
      userId = found.id;
      break;
    }
    if (data.users.length < 200) break;
  }
  if (!userId) throw new Error(`No auth user found for TEST_USER_EMAIL=${email}`);

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('org_id')
    .eq('id', userId)
    .maybeSingle();
  if (error) throw error;
  if (!profile?.org_id) throw new Error(`Test user ${email} has no org_id.`);
  return profile.org_id;
}

export async function getOrCreateFixtureCustomerId(orgId: string): Promise<string> {
  const supabase = admin();
  const name = `${E2E_PREFIX}Fixture_Customer`;

  const { data: existing } = await supabase
    .from('customers')
    .select('id')
    .eq('org_id', orgId)
    .eq('name', name)
    .maybeSingle();
  if (existing) return existing.id;

  const { data: created, error } = await supabase
    .from('customers')
    .insert({ org_id: orgId, name, email: 'e2e_fixture_customer@example.com' })
    .select('id')
    .single();
  if (error) throw error;
  return created.id;
}
