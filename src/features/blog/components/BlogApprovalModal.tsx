"use client";

import React, { useState } from "react";
import Button from "@/components/ui/button/Button";
import { Modal } from "@/components/ui/modal";

interface BlogApprovalModalProps {
  isOpen: boolean;
  isSubmitting: boolean;
  onClose: () => void;
  onApprove: () => Promise<void>;
  onReject: (reason: string) => Promise<void>;
}

const inputClassName =
  "w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800";

const BlogApprovalModal: React.FC<BlogApprovalModalProps> = ({
  isOpen,
  isSubmitting,
  onClose,
  onApprove,
  onReject,
}) => {
  const [reason, setReason] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);

  const handleApprove = async () => {
    setLocalError(null);
    await onApprove();
  };

  const handleReject = async () => {
    if (!reason.trim()) {
      setLocalError("Reason is required when rejecting a blog.");
      return;
    }

    setLocalError(null);
    await onReject(reason.trim());
  };

  const handleClose = () => {
    setReason("");
    setLocalError(null);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      className="max-h-[90vh] max-w-[640px] overflow-y-auto p-5 lg:p-8"
    >
      <div className="mb-6 flex flex-col gap-2">
        <h2 className="text-xl font-bold text-gray-800 dark:text-white/90">Approve Blog</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Approve now or reject with reason. Only Pending blogs can be reviewed.
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Rejection Reason
          </label>
          <textarea
            rows={4}
            className={inputClassName}
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            placeholder="Provide reason when rejecting"
          />
        </div>

        {localError && (
          <p className="rounded-lg border border-error-200 bg-error-50 px-4 py-2 text-sm text-error-700 dark:border-error-500/30 dark:bg-error-500/10 dark:text-error-300">
            {localError}
          </p>
        )}
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-end gap-3">
        <Button variant="outline" onClick={handleClose} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button variant="outline" className="text-error-600 ring-error-300 hover:bg-error-50 dark:text-error-400 dark:ring-error-700 dark:hover:bg-error-500/10" onClick={handleReject} disabled={isSubmitting}>
          {isSubmitting ? "Processing..." : "Reject"}
        </Button>
        <Button variant="primary" onClick={handleApprove} disabled={isSubmitting}>
          {isSubmitting ? "Processing..." : "Approve"}
        </Button>
      </div>
    </Modal>
  );
};

export default BlogApprovalModal;
