"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, ShieldOff } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";

// Reached only when a restricted member's allowed_modules is empty --
// firstAllowedModulePath (lib/domain/modules.ts) has nowhere else to send
// them. Deliberately minimal: no data, no nav, just an explanation and a
// way out.
export default function NoAccessPage() {
  const router = useRouter();
  const [isSigningOut, setIsSigningOut] = useState(false);

  async function handleSignOut() {
    setIsSigningOut(true);
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
      router.push("/login");
      router.refresh();
    } finally {
      setIsSigningOut(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm rounded-2xl border border-gray-200 bg-white p-6 text-center shadow-xs">
        <ShieldOff className="mx-auto h-10 w-10 text-amber-500" />
        <h1 className="mt-4 text-base font-semibold text-gray-900">No access yet</h1>
        <p className="mt-2 text-sm text-gray-500">
          Your account doesn&apos;t have access to any module. Contact your organization owner for access.
        </p>
        <Button
          type="button"
          onClick={handleSignOut}
          disabled={isSigningOut}
          className="mt-5 w-full"
        >
          {isSigningOut && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Sign out
        </Button>
      </div>
    </div>
  );
}
