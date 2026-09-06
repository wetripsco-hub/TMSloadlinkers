import { createClient } from "@/lib/supabase/server";
import { requirePlatformAdmin } from "@/lib/auth/platform-admin";
import { PageBreadcrumb } from "@/components/common/PageBreadCrumb";
import { ResetRequestsQueue, type ResetRequestRow } from "@/components/platform-admin/reset-requests-queue";

export const dynamic = "force-dynamic";

interface ResetRequestWithOrg {
  id: string;
  requested_by: string;
  requested_at: string;
  organizations: { name: string } | null;
}

export default async function PlatformAdminResetRequestsPage() {
  await requirePlatformAdmin();

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("data_reset_requests")
    .select("id, requested_by, requested_at, organizations(name)")
    .eq("status", "pending_approval")
    .order("requested_at", { ascending: true });

  if (error) {
    throw new Error(`Failed to load reset requests: ${error.message}`);
  }

  const requests = (data ?? []) as unknown as ResetRequestWithOrg[];

  // data_reset_requests.requested_by references auth.users, not profiles,
  // so there is no FK PostgREST can embed a profiles join through -- fetch
  // requester emails separately and merge in JS instead.
  const requesterIds = [...new Set(requests.map((r) => r.requested_by))];
  const { data: requesterProfiles } = requesterIds.length
    ? await supabase.from("profiles").select("id, email").in("id", requesterIds)
    : { data: [] as { id: string; email: string | null }[] };

  const emailById = new Map((requesterProfiles ?? []).map((p) => [p.id, p.email]));

  const rows: ResetRequestRow[] = requests.map((req) => ({
    id: req.id,
    orgName: req.organizations?.name ?? "Unknown organization",
    requesterEmail: emailById.get(req.requested_by) ?? null,
    requestedAt: req.requested_at,
  }));

  return (
    <div className="space-y-6 p-6">
      <PageBreadcrumb pageTitle="Data Reset Requests" />
      <ResetRequestsQueue requests={rows} />
    </div>
  );
}
