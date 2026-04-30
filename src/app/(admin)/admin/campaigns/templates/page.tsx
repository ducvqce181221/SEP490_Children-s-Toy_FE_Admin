import React from "react";
import { Metadata } from "next";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import { TemplateTable } from "@/features/template/components/TemplateTable";

export const metadata: Metadata = {
  title: "Template Management | TailAdmin - Next.js Dashboard Template",
  description: "Template Management page for TailAdmin Dashboard",
};

export default function TemplatesPage() {
  return (
    <div>
      <PageBreadcrumb pageTitle="Template Management" />
      <div className="space-y-6">
        <TemplateTable />
      </div>
    </div>
  );
}
