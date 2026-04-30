import React from "react";
import { Metadata } from "next";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import CategoryTable from "@/features/category/components/CategoryTable";

export const metadata: Metadata = {
  title: "Quản lý danh mục | Children's Toy Admin",
  description: "Quản lý danh mục của hệ thống",
};

export default function CategoriesPage() {
  return (
    <div className="space-y-5 sm:space-y-6">
      <PageBreadcrumb pageTitle="Quản lý danh mục" />
      <CategoryTable />
    </div>
  );
}
