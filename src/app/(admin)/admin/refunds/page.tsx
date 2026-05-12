import { Metadata } from "next";
import React from "react";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import { RefundTable } from "@/features/refund/components/RefundTable";

export const metadata: Metadata = {
  title: "Refunds Management | Children's Toy Admin",
  description: "Manage customer refund requests.",
};

export default function RefundsPage() {
  return (
    <div>
      <PageBreadcrumb pageTitle="Refunds Management" />
      <div className="space-y-6">
        <RefundTable />
      </div>
    </div>
  );
}
