import React from "react";
import { Metadata } from "next";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import CategoryTable from "@/features/category/components/CategoryTable";

export const metadata: Metadata = {
  title: "Category Management | Children's Toy Admin",
  description: "Manage categories in the system",
};

export default function CategoriesPage() {
  return (
    <div className="space-y-5 sm:space-y-6">
      <PageBreadcrumb pageTitle="Category Management" />
      <CategoryTable />
    </div>
  );
}
