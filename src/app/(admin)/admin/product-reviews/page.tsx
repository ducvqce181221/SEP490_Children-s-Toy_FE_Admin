import React, { Suspense } from "react";
import { Metadata } from "next";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import { ReviewTable } from "@/features/review/components/ReviewTable";

export const metadata: Metadata = {
  title: "Product Reviews Management | TailAdmin - Next.js Dashboard Template",
  description: "Product Reviews Management page for TailAdmin Dashboard",
};

export default function ProductReviewsPage() {
  return (
    <div>
      <PageBreadcrumb pageTitle="Product Reviews Management" />
      <div className="space-y-6">
        <Suspense fallback={
          <div className="rounded-xl border border-gray-200 bg-white p-10 text-center text-gray-500 dark:border-white/[0.05] dark:bg-white/[0.03]">
            Loading reviews...
          </div>
        }>
          <ReviewTable />
        </Suspense>
      </div>
    </div>
  );
}

