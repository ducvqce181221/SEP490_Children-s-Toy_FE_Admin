import React from "react";
import { TableCell, TableRow } from "@/components/ui/table";
import Badge from "@/components/ui/badge/Badge";
import { Review } from "../types/review";
import { EyeIcon, PencilIcon } from "@/icons/index";
import { formatDisplayDate } from "@/utils/date-utils";
import Link from "next/link";

interface ReviewRowProps {
  review: Review;
  rowNumber: number;
  onView: () => void;
}

const StarRating = ({ rating }: { rating: number }) => {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <svg
          key={star}
          className={`w-4 h-4 ${star <= rating ? "text-yellow-400" : "text-gray-300"}`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );
};

export const ReviewRow = React.memo(function ReviewRow({
  review,
  rowNumber,
  onView,
}: ReviewRowProps) {

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Approved":
        return <Badge size="sm" color="success">Approved</Badge>;
      case "Pending":
      case "ManualReview":
        return <Badge size="sm" color="warning">{status === "ManualReview" ? "Manual Review" : "Pending"}</Badge>;
      case "Rejected":
        return <Badge size="sm" color="error">Rejected</Badge>;
      default:
        return <Badge size="sm" color="light">{status}</Badge>;
    }
  };

  const formattedDate = formatDisplayDate(review.createdAt);

  return (
    <TableRow>
      <TableCell className="px-5 py-4 text-start text-theme-sm text-gray-600 dark:text-gray-300">
        {rowNumber}
      </TableCell>
      <TableCell className="px-5 py-4 sm:px-6">
        <div className="flex flex-col gap-1 max-w-[200px]">
          <span className="font-medium text-gray-800 dark:text-white/90 truncate" title={review.productName}>
            {review.productName}
          </span>
          <span className="text-xs text-gray-500">
            Order: {review.orderCode}
          </span>
        </div>
      </TableCell>

      <TableCell className="px-4 py-3 text-start">
        <div className="flex flex-col gap-1">
          <span className="text-sm text-gray-800 dark:text-gray-200">{review.accountEmail}</span>
          <span className="text-xs text-gray-500">{formattedDate}</span>
        </div>
      </TableCell>

      <TableCell className="px-4 py-3 text-start">
        <div className="flex flex-col gap-1">
          <StarRating rating={review.rating} />
          <span className="text-sm text-gray-500 line-clamp-2 max-w-[250px]" title={review.comment || ""}>
            {review.comment || <i>No comment</i>}
          </span>
        </div>
      </TableCell>

      <TableCell className="px-4 py-3 text-center text-sm text-gray-500">
        <div className="flex flex-col gap-1 items-center">
          <span>🖼️ {review.imagesCount}</span>
          <span>💬 {review.repliesCount}</span>
        </div>
      </TableCell>

      <TableCell className="px-4 py-3 text-start">
        {getStatusBadge(review.moderationStatus)}
      </TableCell>

      <TableCell className="px-4 py-3 text-center">
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={onView}
            className="rounded-lg border border-gray-300 p-2 text-gray-500 transition-colors hover:border-brand-400 hover:text-brand-500 dark:border-gray-700 dark:text-gray-300"
            title="View Details"
          >
            <EyeIcon className="w-5 h-5" />
          </button>
          <Link href={`/admin/product-reviews/${review.reviewId}`}
          >
            <button
              className="rounded-lg border border-gray-300 p-2 text-gray-500 transition-colors hover:border-brand-400 hover:text-brand-500 dark:border-gray-700 dark:text-gray-300"
              title="Edit Review"
            >
              <PencilIcon className="w-5 h-5" />
            </button>
          </Link>
        </div>
      </TableCell>
    </TableRow>
  );
});
