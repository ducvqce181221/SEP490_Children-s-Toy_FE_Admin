import React from "react";
import { Metadata } from "next";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import SuperCategoryTable from "@/features/super-category/components/SuperCategoryTable";

export const metadata: Metadata = {
  title: "Super Category Management | Children's Toy Admin",
  description: "Manage super categories in the system",
};

export default function SuperCategoriesPage() {
  return (
    <div className="space-y-5 sm:space-y-6">
      <PageBreadcrumb pageTitle="Super Category Management" />
      <SuperCategoryTable />
    </div>
  );
}
