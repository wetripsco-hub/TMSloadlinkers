"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { setOrgStatus } from "@/app/actions/platform-admin";

export function SuspendOrgDialog({ orgId, orgName }: { orgId: string; orgName: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSuspend = () => {
    if (!reason.trim()) {
      setError("A reason is required to suspend an organization");
      return;
    }
    setError(null);
    startTransition(async () => {
      try {
        await setOrgStatus(orgId, "suspended", reason);
        setOpen(false);
        setReason("");
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to suspend organization");
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button type="button" variant="outline" size="sm">
            Suspend
          </Button>
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Suspend {orgName}</DialogTitle>
          <DialogDescription>
            Members of this organization will be blocked from the dashboard until it is reactivated.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Label htmlFor="suspend-reason">Reason</Label>
          <textarea
            id="suspend-reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
            placeholder="Why is this organization being suspended?"
          />
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isPending}>
            Cancel
          </Button>
          <Button type="button" variant="destructive" onClick={handleSuspend} disabled={isPending}>
            {isPending ? "Suspending..." : "Suspend organization"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
