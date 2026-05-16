import React from "react";
import { Metadata } from "next";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import BlogTable from "@/features/blog/components/BlogTable";

export const metadata: Metadata = {
  title: "Blog Management | TailAdmin - Next.js Dashboard Template",
  description: "Blog Management page for TailAdmin Dashboard",
};

export default function BlogsPage() {
  return (
    <div>
      <PageBreadcrumb pageTitle="Blog Management" />
      <div className="space-y-6">
        <BlogTable />
      </div>
    </div>
  );
}
