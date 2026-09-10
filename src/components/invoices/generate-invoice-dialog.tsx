"use client";

import { useEffect, useState } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatMoney } from "@/lib/format";
import { generateInvoiceAction, listInvoiceEligibleLoadsAction } from "@/app/(dashboard)/invoices/actions";
import type { Load } from "../../../types/domain";

// `eligibleLoads` is the server-rendered snapshot from
// app/(dashboard)/invoices/page.tsx (status in delivered/pod_uploaded only,
// no check against existing invoices). It's kept only as the initial value
// so the dialog has something to show instantly on open; the moment it
// opens, the real, correctly-scoped list (at least pod_uploaded AND no
// existing shipper_invoice -- which also includes already-invoiced/settled
// loads still missing one) is fetched fresh and replaces it.
export function GenerateInvoiceDialog({ eligibleLoads: initialEligibleLoads }: { eligibleLoads: Load[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loadId, setLoadId] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [eligibleLoads, setEligibleLoads] = useState<Load[]>(initialEligibleLoads);
  const [isLoadingEligible, setIsLoadingEligible] = useState(false);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;

    setIsLoadingEligible(true);
    listInvoiceEligibleLoadsAction()
      .then((loads) => {
        if (!cancelled) setEligibleLoads(loads);
      })
      .catch(() => {
        // Fall back to the stale initial list rather than blocking the
        // dialog from being usable at all.
      })
      .finally(() => {
        if (!cancelled) setIsLoadingEligible(false);
      });

    return () => {
      cancelled = true;
    };
  }, [open]);

  async function handleGenerate() {
    if (!loadId) {
      setError("Choose a load");
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      await generateInvoiceAction(loadId);
      setOpen(false);
      setLoadId("");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate invoice");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button
            type="button"
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm shadow-sm transition-colors"
          >
            Generate invoice
          </Button>
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Generate shipper invoice</DialogTitle>
          <DialogDescription>
            Select a load that has reached at least POD uploaded and doesn&apos;t have a shipper invoice yet.
          </DialogDescription>
        </DialogHeader>

        {eligibleLoads.length === 0 && !isLoadingEligible ? (
          <p className="text-sm text-muted-foreground">
            No loads currently need a shipper invoice.
          </p>
        ) : (
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="load">Load</Label>
            <Select value={loadId} onValueChange={(value) => setLoadId(value ?? "")}>
              <SelectTrigger id="load" className="w-full text-foreground">
                <SelectValue placeholder={isLoadingEligible ? "Loading eligible loads..." : "Select a load"} />
              </SelectTrigger>
              <SelectContent>
                {eligibleLoads.map((load) => (
                  <SelectItem key={load.id} value={load.id}>
                    {(load.loadNumber || load.id.slice(0, 8))} — {formatMoney(load.shipperRate)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {error && <span className="text-sm text-destructive">{error}</span>}

        <DialogFooter>
          <Button
            type="button"
            onClick={handleGenerate}
            disabled={isSubmitting || isLoadingEligible || eligibleLoads.length === 0}
          >
            {isSubmitting ? "Generating..." : "Generate"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
