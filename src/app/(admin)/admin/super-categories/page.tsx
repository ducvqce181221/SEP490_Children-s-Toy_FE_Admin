import React from "react";
import { Metadata } from "next";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import SuperCategoryTable from "@/features/super-category/components/SuperCategoryTable";

export const metadata: Metadata = {
  title: "Quản lý danh mục lớn | Children's Toy Admin",
  description: "Quản lý danh mục lớn của hệ thống",
};

export default function SuperCategoriesPage() {
  return (
    <div className="space-y-5 sm:space-y-6">
      <PageBreadcrumb pageTitle="Quản lý danh mục lớn" />
      <SuperCategoryTable />
    </div>
  );
}
