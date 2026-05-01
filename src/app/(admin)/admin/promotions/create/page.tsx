import React from "react";
import { Metadata } from "next";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import { PromotionForm } from "@/features/promotion/components/PromotionForm";

export const metadata: Metadata = {
  title: "Create Promotion",
};

export default function CreatePromotionPage() {
  return (
    <div>
      <PageBreadcrumb pageTitle="Create Promotion" />
      <div className="space-y-6">
        <PromotionForm />
      </div>
    </div>
  );
}
