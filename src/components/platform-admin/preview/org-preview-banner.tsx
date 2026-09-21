"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Eye } from "lucide-react";
import { endOrgPreview } from "@/app/actions/platform-admin";

const SESSION_SECONDS = 15 * 60;

function formatRemaining(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function OrgPreviewBanner({ orgName, logId }: { orgName: string; logId: string }) {
  const router = useRouter();
  const [remaining, setRemaining] = useState(SESSION_SECONDS);
  const endedRef = useRef(false);

  useEffect(() => {
    const endOnce = () => {
      if (endedRef.current) return;
      endedRef.current = true;
      void endOrgPreview(logId);
    };

    const interval = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          endOnce();
          router.push("/platform-admin/organizations");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // Unmounting covers in-app navigation away from the preview route. A
    // hard tab close/refresh is not caught here -- the session still has a
    // hard SESSION_SECONDS ceiling via the interval above.
    return () => {
      clearInterval(interval);
      endOnce();
    };
  }, [logId, router]);

  return (
    <div className="sticky top-0 z-50 flex items-center justify-between gap-3 border-b border-amber-300 bg-amber-50 px-4 py-2.5 text-sm text-amber-900">
      <div className="flex items-center gap-2 font-medium">
        <Eye className="h-4 w-4" />
        Viewing as {orgName} — read only
      </div>
      <span className="font-mono text-xs text-amber-700">Session ends in {formatRemaining(remaining)}</span>
    </div>
  );
}
