import React from "react";
import { Metadata } from "next";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import BrandTable from "@/features/brand/components/BrandTable";

export const metadata: Metadata = {
  title: "Brand Management | TailAdmin - Next.js Dashboard Template",
  description: "Brand Management page for TailAdmin Dashboard",
};

export default function BrandsPage() {
  return (
    <div>
      <PageBreadcrumb pageTitle="Brand Management" />
      <div className="space-y-6">
        <BrandTable />
      </div>
    </div>
  );
}
