import React from "react";
import { Metadata } from "next";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import WalletTable from "@/features/wallet/components/WalletTable";

export const metadata: Metadata = {
  title: "Wallet Management | TailAdmin - Next.js Dashboard Template",
  description: "Wallet management page for admin dashboard",
};

export default function WalletsPage() {
  return (
    <div>
      <PageBreadcrumb pageTitle="Wallet Management" />
      <div className="space-y-6">
        <WalletTable />
      </div>
    </div>
  );
}
