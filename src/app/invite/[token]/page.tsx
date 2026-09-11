import Link from "next/link";
import { redirect } from "next/navigation";
import { XCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { acceptInvite, getInviteByToken } from "@/app/(dashboard)/settings/team/actions";
import { InviteSignupForm } from "./invite-signup-form";

export const dynamic = "force-dynamic";

function InviteErrorCard({ message }: { message: string }) {
  return (
    <div className="w-full max-w-sm rounded-2xl border border-gray-200 bg-white p-6 text-center shadow-xs dark:border-gray-800 dark:bg-gray-900">
      <XCircle className="mx-auto h-10 w-10 text-rose-500" />
      <h1 className="mt-4 text-base font-semibold text-gray-900 dark:text-white">
        We couldn&apos;t accept this invite
      </h1>
      <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">{message}</p>
      <Link
        href="/overview"
        className="mt-5 inline-flex items-center justify-center rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-700"
      >
        Go to dashboard
      </Link>
    </div>
  );
}

export default async function InvitePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Signed-out visitor: this route is public by design (a new invitee has
  // no account yet) -- render a sign-up form pre-filled from the invite
  // instead of bouncing to /login. getInviteByToken is the same
  // hash/expiry/revoked/accepted lookup acceptInvite uses below, so an
  // invalid link is rejected identically in both branches.
  if (!user) {
    const lookup = await getInviteByToken(token);
    if (!lookup.ok) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 dark:bg-gray-950">
          <InviteErrorCard message={lookup.error} />
        </div>
      );
    }

    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 dark:bg-gray-950">
        <InviteSignupForm token={token} email={lookup.invite.email} />
      </div>
    );
  }

  const result = await acceptInvite(token);

  if (result.ok) {
    redirect(result.redirectTo);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 dark:bg-gray-950">
      <InviteErrorCard message={result.error} />
    </div>
  );
}
