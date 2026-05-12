"use client";
import React, { use } from "react";
import { RefundEditView } from "@/features/refund/components/RefundEditView";

export default function RefundDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const refundId = parseInt(id, 10);

  if (isNaN(refundId)) {
    return <div className="p-10 text-center text-error-500">Invalid Refund ID</div>;
  }

  return <RefundEditView refundId={refundId} />;
}

