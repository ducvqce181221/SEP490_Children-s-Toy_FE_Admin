import React from "react";
import { Metadata } from "next";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import { CampaignWizard } from "@/features/campaign/components/CampaignWizard";

export const metadata: Metadata = {
  title: "Tạo chiến dịch mới | Toy Store Admin",
  description: "Tạo chiến dịch thông báo marketing mới",
};

export default function NewCampaignPage() {
  return (
    <div>
      <PageBreadcrumb pageTitle="Tạo chiến dịch mới" />
      <CampaignWizard />
    </div>
  );
}
