import React, { Suspense } from "react";
import { Metadata } from "next";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import WithdrawalTable from "@/features/withdrawal/components/WithdrawalTable";

export const metadata: Metadata = {
  title: "Withdrawal Management | Admin",
  description: "View and audit all customer withdrawal requests and payout transitions.",
};

export default function AdminWithdrawalsPage() {
  return (
    <div className="space-y-5 sm:space-y-6">
      <PageBreadcrumb pageTitle="Withdrawal Management" />
      <Suspense fallback={<div className="p-10 text-center text-gray-500">Loading withdrawals...</div>}>
        <WithdrawalTable />
      </Suspense>
    </div>
  );
}
