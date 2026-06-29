import React, { useState } from "react";
import { Modal } from "@/components/ui/modal";
import Button from "@/components/ui/button/Button";
import TextArea from "@/components/form/input/TextArea";

interface CampaignReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApprove: () => Promise<boolean>;
  onReject: (reason: string) => Promise<{ ok: boolean; reviewNoteError?: string }>;
  isSubmitting: boolean;
  initialAction?: "approve" | "reject" | null;
}

export const CampaignReviewModal: React.FC<CampaignReviewModalProps> = ({
  isOpen,
  onClose,
  onApprove,
  onReject,
  isSubmitting,
  initialAction = null,
}) => {
  const [rejectReason, setRejectReason] = useState("");
  const [showRejectInput, setShowRejectInput] = useState(false);
  const [rejectError, setRejectError] = useState<string | null>(null);

  React.useEffect(() => {
    if (isOpen) {
      setRejectReason("");
      setShowRejectInput(initialAction === "reject");
      setRejectError(null);
    }
  }, [isOpen, initialAction]);

  const handleClose = () => {
    setRejectReason("");
    setShowRejectInput(false);
    setRejectError(null);
    onClose();
  };

  const handleRejectClick = async () => {
    if (!showRejectInput) {
      setShowRejectInput(true);
      return;
    }

    if (!rejectReason.trim()) {
      setRejectError("Please enter a rejection reason.");
      return;
    }

    setRejectError(null);
    const result = await onReject(rejectReason);
    if (result.ok) handleClose();
    else if (result.reviewNoteError) setRejectError(result.reviewNoteError);
  };

  const handleApproveClick = async () => {
    const ok = await onApprove();
    if (ok) handleClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      className="max-w-md p-6"
    >
      <div className="flex flex-col items-center text-center">
        <div className="flex items-center justify-center w-12 h-12 rounded-full bg-blue-100 text-blue-600 mb-4 dark:bg-blue-900/30 dark:text-blue-400">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>

        <h3 className="mb-2 text-lg font-bold text-gray-800 dark:text-white/90">
          {initialAction === "reject" ? "Reject Campaign" : "Approve Campaign"}
        </h3>

        <p className="mb-6 text-sm text-gray-500 dark:text-gray-400">
          {initialAction === "reject"
            ? "Please provide a reason for rejecting this campaign so the staff can revise it."
            : "Are you sure you want to approve this campaign? Once approved, the campaign will be ready to be scheduled."}
        </p>

        {showRejectInput && (
          <div className="w-full mb-6">
            <label className="block text-sm font-medium text-gray-700 text-left mb-2 dark:text-gray-300">
              Reject Reason <span className="text-error-500">*</span>
              <span className="block text-xs font-normal text-gray-400 mt-0.5">
                Up to 500 characters ({rejectReason.length}/500)
              </span>
            </label>
            <TextArea
              value={rejectReason}
              maxLength={500}
              onChange={(e) => {
                setRejectReason(e.target.value);
                if (rejectError) setRejectError(null);
              }}
              placeholder="Enter reason for rejection so staff can revise..."
              rows={4}
              className="min-h-[96px]"
            />
            {rejectError ? (
              <p className="text-xs text-red-500 mt-1.5 text-left">{rejectError}</p>
            ) : null}
          </div>
        )}

        <div className="flex w-full gap-3">
          <Button
            variant="outline"
            size="sm"
            className="w-full justify-center"
            onClick={handleClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>

          {initialAction !== "approve" && (
            <Button
              variant="outline"
              size="sm"
              className="w-full justify-center bg-error-50 text-error-600 hover:bg-error-100 hover:text-error-700 border-error-200 dark:bg-error-500/10 dark:text-error-400 dark:hover:bg-error-500/20 dark:border-error-500/20"
              onClick={() => void handleRejectClick()}
              disabled={isSubmitting || (showRejectInput && !rejectReason.trim())}
            >
              Reject
            </Button>
          )}

          {initialAction !== "reject" && !showRejectInput && (
            <Button
              size="sm"
              className="w-full justify-center bg-success-500 hover:bg-success-600 text-white"
              onClick={() => void handleApproveClick()}
              disabled={isSubmitting}
            >
              Approve
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
};
