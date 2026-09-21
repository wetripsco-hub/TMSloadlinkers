import type { Metadata } from "next";
import { ShieldAlert } from "lucide-react";

export const metadata: Metadata = {
  title: "Account Suspended | FreightLink TMS",
};

export default function SuspendedPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <ShieldAlert className="mx-auto mb-4 h-10 w-10 text-rose-500" />
        <h1 className="text-xl font-semibold text-slate-900">Your account is suspended</h1>
        <p className="mt-2 text-sm text-slate-600">
          Your organization&apos;s access to FreightLink has been suspended. Contact support for help
          restoring access.
        </p>
      </div>
    </div>
  );
}
