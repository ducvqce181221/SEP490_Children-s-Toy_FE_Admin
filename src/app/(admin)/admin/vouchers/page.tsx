import React from "react";
import { Metadata } from "next";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import { VoucherTable } from "@/features/voucher/components/VoucherTable";

export const metadata: Metadata = {
  title: "Voucher Management | TailAdmin - Next.js Dashboard Template",
  description: "Voucher Management page for TailAdmin Dashboard",
};

export default function VouchersPage() {
  return (
    <div>
      <PageBreadcrumb pageTitle="Voucher Management" />
      <div className="space-y-6">
        <VoucherTable />
      </div>
    </div>
  );
}
