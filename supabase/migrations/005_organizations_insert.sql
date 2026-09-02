-- 005_organizations_insert.sql
-- Allow a signed-in user to create the organization they onboard into.

-- organizations previously had no insert policy, so RLS denied all client
-- inserts. Signup creates exactly one organization per new user before that
-- user's profile has an org_id, mirroring the one-time org assignment the
-- profiles_update_own_row policy already allows.
create policy "organizations_insert_authenticated"
  on organizations for insert
  to authenticated
  with check (true);
