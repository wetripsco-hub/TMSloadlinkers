"use client";

import { useState } from "react";
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
import { generateSettlementAction } from "@/app/(dashboard)/settlements/actions";
import type { Load } from "../../../types/domain";

export function GenerateSettlementDialog({ eligibleLoads }: { eligibleLoads: Load[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loadId, setLoadId] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleGenerate() {
    if (!loadId) {
      setError("Choose a load");
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      await generateSettlementAction(loadId);
      setOpen(false);
      setLoadId("");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate settlement voucher");
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
            disabled={eligibleLoads.length === 0}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm shadow-sm transition-colors"
          >
            Generate settlement
          </Button>
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Generate carrier settlement voucher</DialogTitle>
          <DialogDescription>
            Select a delivered load with a verified proof of delivery to generate a settlement
            voucher for the assigned carrier.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="load">Load</Label>
          <Select value={loadId} onValueChange={(value) => setLoadId(value ?? "")}>
            <SelectTrigger id="load" className="w-full">
              <SelectValue placeholder="Select a load" />
            </SelectTrigger>
            <SelectContent>
              {eligibleLoads.map((load) => (
                <SelectItem key={load.id} value={load.id}>
                  {(load.loadNumber || load.id.slice(0, 8))} — {formatMoney(load.carrierPay)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {error && <span className="text-sm text-destructive">{error}</span>}

        <DialogFooter>
          <Button type="button" onClick={handleGenerate} disabled={isSubmitting}>
            {isSubmitting ? "Generating..." : "Generate"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
