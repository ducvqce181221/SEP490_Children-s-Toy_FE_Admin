import React from "react";
import { Metadata } from "next";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import { CampaignListPage } from "@/features/campaign/components/CampaignListPage";

export const metadata: Metadata = {
  title: "Notification Campaigns | Toy Store Admin",
  description: "Manage notification marketing campaigns for customers",
};

export default function CampaignsPage() {
  return (
    <div>
      <PageBreadcrumb pageTitle="Campaign Management" />
      <CampaignListPage />
    </div>
  );
}
