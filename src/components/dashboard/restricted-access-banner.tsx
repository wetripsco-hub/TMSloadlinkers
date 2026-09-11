import { AlertTriangle } from "lucide-react";
import { APP_MODULES } from "@/lib/domain/modules";

// Rendered when middleware.ts redirects here after blocking a module route
// the current member isn't allowed to open (?restricted=<module key>).
export function RestrictedAccessBanner({ moduleKey }: { moduleKey: string | undefined }) {
  if (!moduleKey) return null;

  const label = APP_MODULES.find((m) => m.key === moduleKey)?.label ?? moduleKey;

  return (
    <div className="flex items-center gap-3 rounded-md border border-amber-200 bg-amber-50/90 p-4 shadow-xs">
      <AlertTriangle className="h-5 w-5 shrink-0 text-amber-600" />
      <p className="text-sm font-medium text-amber-900">
        You don&apos;t have access to {label}. Contact your organization owner or admin to request access.
      </p>
    </div>
  );
}
