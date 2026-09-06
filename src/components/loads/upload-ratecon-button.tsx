"use client";

import { useState } from "react";
import { Sparkles } from "lucide-react";

import { Modal } from "@/components/ui/tailadmin/modal";
import { TailAdminButton } from "@/components/ui/tailadmin/form-elements";
import { RateConReviewModal } from "@/components/loads/ratecon-review-modal";

export function UploadRateConButton() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <TailAdminButton
        variant="outline"
        size="md"
        onClick={() => setIsOpen(true)}
        startIcon={<Sparkles className="h-4 w-4 text-blue-500" />}
      >
        Upload RateCon (AI)
      </TailAdminButton>

      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="Create Load from RateCon"
        description="Upload a signed rate confirmation and we'll extract the load details."
        maxWidth="xl"
      >
        {/* Remounts on every open, so internal step/form state always resets on close. */}
        {isOpen && <RateConReviewModal onClose={() => setIsOpen(false)} />}
      </Modal>
    </>
  );
}
