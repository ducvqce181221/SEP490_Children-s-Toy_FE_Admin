import React, { Suspense } from "react";
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
        <Suspense fallback={<div className="p-10 text-center text-gray-500">Loading vouchers...</div>}>
          <VoucherTable />
        </Suspense>
      </div>
    </div>
  );
}
