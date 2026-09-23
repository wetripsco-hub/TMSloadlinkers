"use client";

import React, { useState } from "react";
import { EditLoadModal } from "@/components/loads/edit-load-modal";
import { CancelLoadButton } from "@/components/loads/cancel-load-button";
import { TailAdminButton } from "@/components/ui/tailadmin/form-elements";
import { Pencil } from "lucide-react";
import type { Load } from "../../../types/domain";
import type { CustomerRecord } from "@/lib/repositories/customers";

export interface LoadDetailActionsProps {
  load: Load;
  customers: CustomerRecord[];
}

export function LoadDetailActions({ load, customers }: LoadDetailActionsProps) {
  const [editOpen, setEditOpen] = useState(false);

  return (
    <>
      <TailAdminButton
        variant="outline"
        size="sm"
        onClick={() => setEditOpen(true)}
        startIcon={<Pencil className="h-3.5 w-3.5" />}
      >
        Edit Load
      </TailAdminButton>

      <CancelLoadButton loadId={load.id} />

      <EditLoadModal
        isOpen={editOpen}
        onClose={() => setEditOpen(false)}
        load={load}
        customers={customers}
      />
    </>
  );
}

export default LoadDetailActions;
