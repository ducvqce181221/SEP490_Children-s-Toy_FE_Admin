import React from "react";
import { Metadata } from "next";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import { CampaignListPage } from "@/features/campaign/components/CampaignListPage";

export const metadata: Metadata = {
  title: "Chiến dịch thông báo | Toy Store Admin",
  description: "Quản lý các chiến dịch gửi thông báo marketing đến khách hàng",
};

export default function CampaignsPage() {
  return (
    <div>
      <PageBreadcrumb pageTitle="Chiến dịch thông báo" />
      <CampaignListPage />
    </div>
  );
}
