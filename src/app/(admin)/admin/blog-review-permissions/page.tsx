import { Metadata } from "next";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import { BlogReviewPermissionManagement } from "@/features/blog/components/BlogReviewPermissionManagement";

export const metadata: Metadata = {
  title: "Blog Review Permissions | Toy Store Admin",
  description: "Manage accounts locked from blog comment permissions",
};

export default function BlogReviewPermissionsPage() {
  return (
    <div>
      <PageBreadcrumb pageTitle="Blog Review Permissions" />
      <BlogReviewPermissionManagement />
    </div>
  );
}
