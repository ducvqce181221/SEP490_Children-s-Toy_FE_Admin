import { Metadata } from "next";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import BlogReviewManageTable from "@/features/blog/components/BlogReviewManageTable";

export const metadata: Metadata = {
  title: "Blog Review Management",
  description: "Manage blog reviews and replies",
};

export default function BlogReviewPage() {
  return (
    <div>
      <PageBreadcrumb pageTitle="Blog Review Management" />
      <BlogReviewManageTable />
    </div>
  );
}
