"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { setOrgStatus } from "@/app/actions/platform-admin";

export function ReactivateOrgButton({ orgId }: { orgId: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      disabled={isPending}
      onClick={() =>
        startTransition(async () => {
          await setOrgStatus(orgId, "active");
          router.refresh();
        })
      }
    >
      {isPending ? "Reactivating..." : "Reactivate"}
    </Button>
  );
}
