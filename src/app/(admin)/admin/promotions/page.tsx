import React from "react";
import { Metadata } from "next";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import { PromotionTable } from "@/features/promotion/components/PromotionTable";

export const metadata: Metadata = {
  title: "Promotion Management",
  description: "Promotion Management page for Dashboard",
};

export default function PromotionsPage() {
  return (
    <div>
      <PageBreadcrumb pageTitle="Promotion Management" />
      <div className="space-y-6">
        <PromotionTable />
      </div>
    </div>
  );
}
