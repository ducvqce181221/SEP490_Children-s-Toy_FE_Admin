import React from "react";
import { Metadata } from "next";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import AccountTable from "@/features/account/components/AccountTable";

export const metadata: Metadata = {
  title: "Account Management | TailAdmin - Next.js Dashboard Template",
  description: "Account Management page for TailAdmin Dashboard",
};

export default function AccountsPage() {
  return (
    <div>
      <PageBreadcrumb pageTitle="Account Management" />
      <div className="space-y-6">
        <AccountTable />
      </div>
    </div>
  );
}
