"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { TailAdminSelect, TailAdminButton } from "@/components/ui/tailadmin/form-elements";
import { linkDocumentToLoadManually } from "@/app/actions/link-document-to-load-manually";
import type { UUID } from "../../../types/domain";

export interface ManualLinkControlProps {
  documentId: UUID;
  loadOptions: { value: string; label: string }[];
}

export function ManualLinkControl({ documentId, loadOptions }: ManualLinkControlProps) {
  const router = useRouter();
  const [selectedLoadId, setSelectedLoadId] = useState("");
  const [isLinking, setIsLinking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleLink() {
    if (!selectedLoadId) return;
    setError(null);
    setIsLinking(true);
    try {
      await linkDocumentToLoadManually(documentId, selectedLoadId);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not link document");
      setIsLinking(false);
    }
  }

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-1.5">
        <TailAdminSelect
          value={selectedLoadId}
          onChange={(e) => setSelectedLoadId(e.target.value)}
          placeholder="Select load..."
          options={loadOptions}
          disabled={isLinking}
          className="h-8 w-40 py-1 text-xs"
        />
        <TailAdminButton
          type="button"
          size="sm"
          variant="outline"
          loading={isLinking}
          disabled={!selectedLoadId}
          onClick={handleLink}
        >
          Link
        </TailAdminButton>
      </div>
      {error && <span className="text-xs text-rose-600">{error}</span>}
    </div>
  );
}
