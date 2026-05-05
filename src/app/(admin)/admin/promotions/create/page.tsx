import React from "react";
import { Metadata } from "next";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import { PromotionWizard } from "@/features/promotion/components/PromotionWizard";

export const metadata: Metadata = {
  title: "Create Promotion",
};

export default function CreatePromotionPage() {
  return (
    <div>
      <PageBreadcrumb 
        pageTitle="Create Promotion" 
        breadcrumbItems={[
          { label: "Promotion Management", href: "/admin/promotions" },
          { label: "Create Promotion" }
        ]}
      />
      <div className="space-y-6">
        <PromotionWizard />
      </div>
    </div>
  );
}
