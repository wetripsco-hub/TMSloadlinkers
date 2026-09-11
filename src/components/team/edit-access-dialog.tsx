"use client";

import { useState, useTransition } from "react";
import { Loader2, Settings2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ModuleAccessChecklist } from "@/components/team/module-access-checklist";
import { updateMemberAllowedModules } from "@/app/(dashboard)/settings/team/actions";

export function EditAccessDialog({
  memberId,
  memberName,
  allowedModules,
}: {
  memberId: string;
  memberName: string;
  allowedModules: string[];
}) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<string[]>(allowedModules);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen);
    if (nextOpen) {
      setSelected(allowedModules);
      setError(null);
    }
  }

  function handleSave() {
    setError(null);

    if (selected.length === 0) {
      setError("Select at least one module");
      return;
    }

    startTransition(async () => {
      try {
        await updateMemberAllowedModules(memberId, selected);
        setOpen(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not update access");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger
        render={
          <button
            type="button"
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-xs hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
          >
            <Settings2 className="h-3.5 w-3.5" />
            Edit access
          </button>
        }
      />
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit access</DialogTitle>
          <DialogDescription>
            Choose which modules {memberName} can see and open.
          </DialogDescription>
        </DialogHeader>

        <ModuleAccessChecklist selected={selected} onChange={setSelected} />

        {error && <p className="text-sm text-rose-600">{error}</p>}

        <DialogFooter>
          <button
            type="button"
            onClick={handleSave}
            disabled={isPending || selected.length === 0}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Save
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
