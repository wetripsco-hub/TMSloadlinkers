import Link from "next/link";
import { redirect } from "next/navigation";
import { XCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { acceptInvite } from "@/app/(dashboard)/settings/team/actions";

export const dynamic = "force-dynamic";

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

  if (!user) {
    redirect(`/login?next=/invite/${token}`);
  }

  const result = await acceptInvite(token);

  if (result.ok) {
    redirect("/overview");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 dark:bg-gray-950">
      <div className="w-full max-w-sm rounded-2xl border border-gray-200 bg-white p-6 text-center shadow-xs dark:border-gray-800 dark:bg-gray-900">
        <XCircle className="mx-auto h-10 w-10 text-rose-500" />
        <h1 className="mt-4 text-base font-semibold text-gray-900 dark:text-white">
          We couldn&apos;t accept this invite
        </h1>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">{result.error}</p>
        <Link
          href="/overview"
          className="mt-5 inline-flex items-center justify-center rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-700"
        >
          Go to dashboard
        </Link>
      </div>
    </div>
  );
}
