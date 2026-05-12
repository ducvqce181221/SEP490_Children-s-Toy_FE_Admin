import React, { useState } from "react";
import { useRouter } from "next/navigation";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import Button from "@/components/ui/button/Button";
import Badge from "@/components/ui/badge/Badge";
import { useReviewDetail } from "../hooks/useReviewDetail";
import { formatDisplayDate } from "@/utils/date-utils";
import { useReviewMutations } from "../hooks/useReviewMutations";
import { ReviewStatusModal } from "./ReviewStatusModal";
import { ReviewReplyForm } from "./ReviewReplyForm";
import { ReviewReply } from "../types/review";
import { PencilIcon, TrashBinIcon, ChevronLeftIcon } from "@/icons/index";

interface ReviewEditViewProps {
  reviewId: number;
}

const StarRating = ({ rating }: { rating: number }) => (
  <div className="flex items-center gap-1">
    {[1, 2, 3, 4, 5].map((star) => (
      <svg key={star} className={`w-5 h-5 ${star <= rating ? "text-yellow-400" : "text-gray-300"}`} fill="currentColor" viewBox="0 0 20 20">
        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
      </svg>
    ))}
  </div>
);

export const ReviewEditView: React.FC<ReviewEditViewProps> = ({ reviewId }) => {
  const router = useRouter();
  const { reviewDetail: review, isLoading, error, refetch } = useReviewDetail(reviewId);
  
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [replyToEdit, setReplyToEdit] = useState<ReviewReply | null>(null);

  const { isSubmitting, updateStatus, createReply, updateReply, deleteReply } = useReviewMutations(() => {
    setIsStatusModalOpen(false);
    setShowReplyForm(false);
    setReplyToEdit(null);
    refetch();
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Approved": return <Badge size="sm" color="success">Approved</Badge>;
      case "Pending":
      case "ManualReview": return <Badge size="sm" color="warning">{status === "ManualReview" ? "Manual Review" : "Pending"}</Badge>;
      case "Rejected": return <Badge size="sm" color="error">Rejected</Badge>;
      default: return <Badge size="sm" color="light">{status}</Badge>;
    }
  };

  const handleEditReply = (reply: ReviewReply) => {
    setReplyToEdit(reply);
    setShowReplyForm(true);
    // Scroll to form
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelReply = () => {
    setShowReplyForm(false);
    setReplyToEdit(null);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error || !review) {
    return (
      <div className="p-6 text-center bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700">
        <div className="text-error-500 mb-4">{error || "Review not found"}</div>
        <Button variant="outline" onClick={() => router.push("/admin/product-reviews")}>
          Back to List
        </Button>
      </div>
    );
  }

  return (
    <div className="pb-10">
      <PageBreadcrumb 
        pageTitle="Edit Review" 
        breadcrumbs={[
          { label: "Product Reviews", href: "/admin/product-reviews" },
          { label: "Moderation" }
        ]}
      />

      <div className="flex justify-between items-center mb-6">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => router.push("/admin/product-reviews")}
          className="gap-2"
        >
          <ChevronLeftIcon className="w-5 h-5"/> Back to List
        </Button>
        <Button variant="primary" size="sm" onClick={() => setIsStatusModalOpen(true)}>
          Change Status
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-10 gap-6">
        {/* Cột trái: Nội dung Review */}
        <div className="lg:col-span-6 space-y-6">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm">
            <div className="flex flex-col items-start gap-2 mb-6">
              <h3 className="font-bold text-gray-800 dark:text-white/90 text-xl">Review Moderation</h3>
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-500">Product: <span className="font-medium text-gray-700 dark:text-gray-300">{review.productName}</span></span>
                {getStatusBadge(review.moderationStatus)}
              </div>
            </div>
            
            <div className="flex items-center gap-4 mb-4 dark:bg-gray-700/30 rounded-xl">
              <div className="w-12 h-12 rounded-full bg-brand-100 flex items-center justify-center text-brand-600 font-bold text-lg">
                {review.accountName.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1">
                <div className="font-semibold text-gray-800 dark:text-white/90">{review.accountName}</div>
                <div className="text-sm text-gray-500">{review.accountEmail}</div>
              </div>
              <div className="text-xs text-gray-400">
                {formatDisplayDate(review.createdAt)}
              </div>
            </div>

            <div className="mb-4">
              <div className="text-sm text-gray-500 mb-1.5">Rating</div>
              <StarRating rating={review.rating} />
            </div>
            
            <div>
              <div className="text-sm text-gray-500 mb-1.5">Customer Comment</div>
              <div className="text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-700/30 p-5 rounded-xl min-h-[120px] whitespace-pre-wrap italic">
                {review.comment || "No text content provided in this review."}
              </div>
            </div>
          </div>

          {/* Images Section */}
          {review.images && review.images.length > 0 && (
            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm">
              <h4 className="font-bold text-gray-800 dark:text-white/90 mb-4 flex items-center gap-2">
                Attached Images <Badge size="sm" color="light">{review.images.length}</Badge>
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {review.images.map((img, index) => (
                  <div key={img.imageId || index} className="relative aspect-square rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 group cursor-zoom-in">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={img.imageUrl} alt="Review" className="object-cover w-full h-full transition-transform duration-300 group-hover:scale-110" />
                    <div className="absolute top-2 right-2">
                      {getStatusBadge(img.moderationStatus)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Cột phải: Replies & Logs */}
        <div className="lg:col-span-4 space-y-6">
          {/* Inline Reply Form */}
          {showReplyForm ? (
            <ReviewReplyForm 
              replyToEdit={replyToEdit}
              isSubmitting={isSubmitting}
              onCancel={handleCancelReply}
              onSave={(data) => {
                if (replyToEdit) {
                  updateReply(review.reviewId, replyToEdit.replyProductId, data);
                } else {
                  createReply(review.reviewId, data);
                }
              }}
            />
          ) : (
            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm">
              <div className="flex justify-between items-center mb-6">
                <h4 className="font-bold text-gray-800 dark:text-white/90">Staff Replies</h4>
                <Button variant="primary" size="sm" onClick={() => setShowReplyForm(true)}>
                  Add Reply
                </Button>
              </div>
              
              {review.replies.length === 0 ? (
                <div className="text-center py-10 text-sm text-gray-400 italic bg-gray-50 dark:bg-gray-700/20 rounded-xl border border-dashed border-gray-200 dark:border-gray-700">
                  No replies yet. Click &quot;Add Reply&quot; to respond.
                </div>
              ) : (
                <div className="space-y-4">
                  {review.replies.map((reply, index) => (
                    <div key={`${reply.replyProductId}-${index}`} className="p-4 rounded-xl border border-brand-100 dark:border-brand-900/20 bg-brand-50/30 dark:bg-brand-900/10">
                      <div className="flex justify-between items-center mb-2">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-brand-700 dark:text-brand-400 text-sm">{reply.staffName}</span>
                          <span className="text-xs text-gray-400 uppercase tracking-wider">{formatDisplayDate(reply.createdAt)}</span>
                        </div>
                        <div className="flex gap-1">
                          <button onClick={() => handleEditReply(reply)} className="p-1.5 text-gray-400 hover:text-brand-500 transition-colors" title="Edit">
                            <PencilIcon className="w-5 h-5" />
                          </button>
                          <button onClick={() => deleteReply(review.reviewId, reply.replyProductId)} className="p-1.5 text-gray-400 hover:text-error-500 transition-colors" title="Delete">
                            <TrashBinIcon className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                      <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">{reply.content}</p>
                      {reply.updatedAt && (
                        <div className="mt-2 text-xs text-gray-400 italic">
                          Edited on {formatDisplayDate(reply.updatedAt)}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Moderation Logs */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm">
            <h4 className="font-bold text-gray-800 dark:text-white/90 mb-6">Moderation History</h4>
            
            {review.moderationLogs.length === 0 ? (
              <div className="text-sm text-gray-400 italic">No history available for this review.</div>
            ) : (
              <div className="relative border-l-2 border-gray-100 dark:border-gray-700 ml-3 space-y-8">
                {review.moderationLogs.map((log, index) => (
                  <div key={`${log.logId}-${index}`} className="relative pl-7">
                    <div className="absolute w-3.5 h-3.5 bg-brand-500 rounded-full left-[-8.5px] top-1 ring-4 ring-white dark:ring-gray-800"></div>
                    <div className="flex flex-col gap-1 mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-gray-800 dark:text-white/90">
                          {log.moderatorType === "AI" ? "🤖 AI Moderator" : (log.moderatedByName || "System")}
                        </span>
                        <span className="text-[10px] text-gray-400 uppercase tracking-widest">{formatDisplayDate(log.createdAt)}</span>
                      </div>
                      <div className="text-xs text-gray-500">
                        Status: <span className="line-through">{log.previousStatus}</span> → <span className="font-bold text-gray-700 dark:text-gray-300">{log.newStatus}</span>
                      </div>
                    </div>
                    {log.reason && (
                      <div className="text-xs text-gray-500 bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg border border-gray-100 dark:border-gray-600">
                        <span className="font-bold mr-1">Note:</span>{log.reason}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <ReviewStatusModal
        isOpen={isStatusModalOpen}
        onClose={() => setIsStatusModalOpen(false)}
        currentStatus={review.moderationStatus}
        isSubmitting={isSubmitting}
        onSave={(data) => updateStatus(review.reviewId, data)}
      />
    </div>
  );
};
