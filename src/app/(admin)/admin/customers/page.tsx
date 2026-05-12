import React from "react";
import { Metadata } from "next";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import CustomerTable from "@/features/customer/components/CustomerTable";

export const metadata: Metadata = {
  title: "Customer Management | TailAdmin - Next.js Dashboard Template",
  description: "Customer Management page for TailAdmin Dashboard",
};

export default function CustomersPage() {
  return (
    <div>
      <PageBreadcrumb pageTitle="Customer Management" />
      <div className="space-y-6">
        <CustomerTable />
      </div>
    </div>
  );
}
