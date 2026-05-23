import React from "react";
import { Modal } from "@/components/ui/modal";
import Button from "@/components/ui/button/Button";
import Badge from "@/components/ui/badge/Badge";
import { useReviewDetail } from "../hooks/useReviewDetail";
import { formatDisplayDate } from "@/utils/date-utils";

interface ReviewDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  reviewId: number;
}

const StarRating = ({ rating }: { rating: number }) => (
  <div className="flex items-center gap-1">
    {[1, 2, 3, 4, 5].map((star) => (
      <svg key={star} className={`w-4 h-4 ${star <= rating ? "text-yellow-400" : "text-gray-300"}`} fill="currentColor" viewBox="0 0 20 20">
        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
      </svg>
    ))}
  </div>
);

export const ReviewDetailModal: React.FC<ReviewDetailModalProps> = ({
  isOpen,
  onClose,
  reviewId,
}) => {
  const { reviewDetail: review, isLoading, error } = useReviewDetail(isOpen ? reviewId : null);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Approved": return <Badge size="sm" color="success">Approved</Badge>;
      case "Pending":
      case "ManualReview": return <Badge size="sm" color="warning">{status === "ManualReview" ? "Manual Review" : "Pending"}</Badge>;
      case "Rejected": return <Badge size="sm" color="error">Rejected</Badge>;
      default: return <Badge size="sm" color="light">{status}</Badge>;
    }
  };

  const getModeratorLabel = (log: any) => {
    if (log.moderatorType !== "AI") {
      return log.moderatedByName || "System";
    }
    const typeSuffix = log.targetType ? ` (${log.targetType})` : "";
    if (log.aiModelVersion) {
      return `🤖 AI Moderator${typeSuffix}`;
    }
    return `⚙️ Rule Validation${typeSuffix}`;
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-[900px] w-[90vw] p-0 overflow-hidden max-h-[90vh]">
      <div className="flex flex-col h-[90vh] max-h-[inherit]">
        {/* Header */}
        <div className="p-5 border-b border-gray-100 dark:border-white/[0.05] bg-white dark:bg-gray-900 z-10 shrink-0">
          <h2 className="text-xl font-bold text-gray-800 dark:text-white/90">Review Details</h2>
          <p className="text-xs text-gray-500">ID: #{reviewId}</p>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 bg-gray-50 dark:bg-gray-900">
          {isLoading ? (
            <div className="flex justify-center items-center h-40">
              <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : error || !review ? (
            <div className="flex justify-center items-center h-40 text-error-500">{error || "Review not found"}</div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left Column: Review Content */}
              <div className="space-y-6">
                <div className="bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-200 dark:border-gray-700 shadow-xs">
                  <div className="mb-4">
                    <h3 className="font-semibold text-gray-800 dark:text-white/90 mb-1">{review.productName}</h3>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500">Order: {review.orderCode}</span>
                      {getStatusBadge(review.moderationStatus)}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 mb-4 dark:bg-gray-700/50 rounded-lg">
                    <div className="w-10 h-10 rounded-full bg-brand-100 flex items-center justify-center text-brand-600 font-bold">
                      {review.accountName.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-800 dark:text-white/90">{review.accountName}</div>
                      <div className="text-[10px] text-gray-500">{review.accountEmail}</div>
                    </div>
                    <div className="text-[10px] text-gray-400">
                      {formatDisplayDate(review.createdAt)}
                    </div>
                  </div>

                  <div className="mb-4">
                    <div className="text-xs text-gray-500 mb-1">Rating</div>
                    <StarRating rating={review.rating} />
                  </div>

                  <div>
                    <div className="text-xs text-gray-500 mb-1.5">Comment</div>
                    <div className="text-sm text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg italic">
                      {review.comment || "No comment provided."}
                    </div>
                  </div>
                </div>

                {/* Images */}
                {review.images && review.images.length > 0 && (
                  <div className="bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-200 dark:border-gray-700 shadow-xs">
                    <h4 className="text-sm font-semibold text-gray-800 dark:text-white/90 mb-3">Attached Images ({review.images.length})</h4>
                    <div className="grid grid-cols-3 gap-2">
                      {review.images.map((img, index) => (
                        <div key={`${img.imageId || index}-${index}`} className="relative aspect-square rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={img.imageUrl} alt="Review" className="object-cover w-full h-full" />
                          <div className="absolute top-1 right-1 scale-75 origin-top-right">
                            {getStatusBadge(img.moderationStatus)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Right Column: Replies & History */}
              <div className="space-y-6">
                <div className="bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-200 dark:border-gray-700 shadow-xs">
                  <h4 className="text-sm font-semibold text-gray-800 dark:text-white/90 mb-4">Staff Replies</h4>
                  {review.replies.length === 0 ? (
                    <div className="text-xs text-gray-500 italic">No replies yet.</div>
                  ) : (
                    <div className="space-y-3">
                      {review.replies.map((reply, index) => (
                        <div key={`${reply.replyProductId}-${index}`} className="p-3 rounded-lg bg-brand-50/50 dark:bg-brand-900/10 border border-brand-100 dark:border-brand-900/20">
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-xs font-bold text-brand-700 dark:text-brand-400">{reply.staffName}</span>
                            <span className="text-[10px] text-gray-400">{formatDisplayDate(reply.createdAt)}</span>
                          </div>
                          <p className="text-xs text-gray-700 dark:text-gray-300">{reply.content}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-200 dark:border-gray-700 shadow-xs">
                  <h4 className="text-sm font-semibold text-gray-800 dark:text-white/90 mb-4">Moderation History</h4>
                  {review.moderationLogs.length === 0 ? (
                    <div className="text-xs text-gray-500 italic">No history available.</div>
                  ) : (
                    <div className="relative border-l border-gray-200 dark:border-gray-700 ml-2 space-y-4">
                      {review.moderationLogs.map((log, index) => (
                        <div key={`${log.logId}-${index}`} className="relative pl-5">
                          <div className="absolute w-2.5 h-2.5 bg-brand-500 rounded-full -left-[5.5px] top-1 ring-2 ring-white dark:ring-gray-800"></div>
                          <div className="text-[10px] text-gray-400 mb-1">{formatDisplayDate(log.createdAt)}</div>
                          <div className="text-xs font-semibold text-gray-800 dark:text-white/90">
                            {getModeratorLabel(log)}
                          </div>
                          <div className="text-[10px] text-gray-500 mb-1">
                            Result: <span className="font-semibold text-brand-600 dark:text-brand-400">{log.action}</span>
                          </div>
                          {log.reason && (
                            <div className="text-[11px] text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-700/50 p-2 rounded border border-gray-100 dark:border-gray-700/30">
                              <span className="font-semibold text-gray-700 dark:text-gray-300">Reason:</span> {log.reason}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-100 dark:border-white/[0.05] flex justify-end bg-white dark:bg-gray-900 z-10 shrink-0">
          <Button variant="outline" size="sm" onClick={onClose}>Close</Button>
        </div>
      </div>
    </Modal>
  );
};
