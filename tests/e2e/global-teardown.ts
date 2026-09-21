import path from 'node:path';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { E2E_PREFIX } from './helpers/test-data';

dotenv.config({ path: path.resolve(__dirname, '../../.env.local') });

// Most modules (carriers, customers, loads, invoices, settlements) have no
// delete action in the app UI, so specs that create real rows tag them with
// E2E_PREFIX and this teardown removes them directly via the service role
// key after the full run, in dependency order (children before parents).
export default async function globalTeardown() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    console.warn(
      '[global-teardown] SUPABASE_SERVICE_ROLE_KEY / NEXT_PUBLIC_SUPABASE_URL not set — skipping test-data cleanup.'
    );
    return;
  }

  const supabase = createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const like = `${E2E_PREFIX}%`;

  // load_number is a generated column (can't be written), so tag test loads
  // via origin_facility_name instead (set from the wizard's origin facility
  // name field, which accepts arbitrary text).
  const { data: taggedLoads } = await supabase
    .from('loads')
    .select('id')
    .like('origin_facility_name', like);
  const loadIds = (taggedLoads ?? []).map((l) => l.id);

  if (loadIds.length > 0) {
    await supabase.from('invoices').delete().in('load_id', loadIds);
    await supabase.from('load_documents').delete().in('load_id', loadIds);
    await supabase.from('load_notes').delete().in('load_id', loadIds);
    await supabase.from('gps_pings').delete().in('load_id', loadIds);
    await supabase.from('loads').delete().in('id', loadIds);
  }

  // documents.spec.ts uploads tests/e2e/fixtures-data/sample-pod.png as an
  // unassigned document; it has no E2E_PREFIX-taggable text field, so it's
  // matched by its known fixture filename instead.
  const { data: taggedDocs } = await supabase
    .from('load_documents')
    .select('id, file_url')
    .ilike('file_url', '%sample-pod%');
  if (taggedDocs && taggedDocs.length > 0) {
    const paths = taggedDocs.map((d) => d.file_url).filter((p): p is string => !!p);
    if (paths.length > 0) {
      await supabase.storage.from('load-documents').remove(paths);
    }
    await supabase
      .from('load_documents')
      .delete()
      .in('id', taggedDocs.map((d) => d.id));
  }

  const results = await Promise.allSettled([
    supabase.from('carriers').delete().like('name', like),
    supabase.from('customers').delete().like('name', like),
    supabase.from('support_tickets').delete().like('subject', like),
    supabase.from('invitations').delete().like('email', `e2e_test_%`),
  ]);

  results.forEach((result, i) => {
    if (result.status === 'rejected') {
      console.warn(`[global-teardown] cleanup step ${i} failed:`, result.reason);
    } else if (result.value.error) {
      console.warn(`[global-teardown] cleanup step ${i} error:`, result.value.error.message);
    }
  });
}
