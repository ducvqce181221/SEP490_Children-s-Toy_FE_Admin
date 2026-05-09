"use client";

import { use } from "react";
import { ReviewEditView } from "@/features/review/components/ReviewEditView";

export default function ReviewDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const reviewId = parseInt(id, 10);

  return <ReviewEditView reviewId={reviewId} />;
}
