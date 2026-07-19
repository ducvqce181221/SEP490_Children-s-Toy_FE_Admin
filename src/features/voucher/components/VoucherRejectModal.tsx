import React, { useState } from "react";
import { Modal } from "@/components/ui/modal";
import Button from "@/components/ui/button/Button";
import Label from "@/components/form/Label";
import TextArea from "@/components/form/input/TextArea";

interface VoucherRejectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void;
  isSubmitting?: boolean;
}

export const VoucherRejectModal: React.FC<VoucherRejectModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  isSubmitting = false,
}) => {
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");

  const handleConfirm = () => {
    if (!reason.trim()) {
      setError("Reason is required when rejecting a voucher.");
      return;
    }
    if (reason.length > 500) {
      setError("Reason must not exceed 500 characters.");
      return;
    }
    setError("");
    onConfirm(reason);
  };

  const handleClose = () => {
    setReason("");
    setError("");
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} className="max-w-[500px] p-6">
      <div className="flex flex-col gap-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
            Reject Voucher
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-6">
            Please provide a reason for rejecting this voucher. This reason will be visible to the staff who created it.
          </p>
        </div>

        <div>
          <div className="flex justify-between items-center mb-1">
            <Label htmlFor="rejectReason" className="mb-0">
              Reason <span className="text-error-500">*</span>
            </Label>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {(reason || "").length}/500
            </span>
          </div>
          <TextArea
            id="rejectReason"
            rows={4}
            className="mt-1.5"
            placeholder="Enter rejection reason..."
            value={reason}
            error={!!error}
            hint={error}
            maxLength={500}
            onChange={(e) => {
              setReason(e.target.value);
              if (e.target.value.trim()) {
                if (e.target.value.length <= 500) {
                  setError("");
                } else {
                  setError("Reason must not exceed 500 characters.");
                }
              }
            }}
          />
        </div>

        <div className="flex justify-end gap-3 mt-4">
          <Button variant="outline" onClick={handleClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button variant="primary" className="bg-error-500 hover:bg-error-600 border-error-500 hover:border-error-600 text-white" onClick={handleConfirm} disabled={isSubmitting}>
            {isSubmitting ? "Rejecting..." : "Confirm Reject"}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
