import React from "react";
import { Metadata } from "next";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import ProductTable from "@/features/product/components/ProductTable";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Product Management | Children's Toy Admin",
  description: "Manage products in the system",
};

export default function ProductsPage() {
  return (
    <div className="space-y-5 sm:space-y-6">
      <PageBreadcrumb pageTitle="Product Management" />
      <Suspense fallback={<div className="p-10 text-center text-gray-500">Loading product table...</div>}>
        <ProductTable />
      </Suspense>
    </div>
  );
}
