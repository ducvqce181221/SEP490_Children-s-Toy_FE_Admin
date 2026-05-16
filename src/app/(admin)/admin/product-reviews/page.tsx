import React from "react";
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
        <ReviewTable />
      </div>
    </div>
  );
}
