import React from "react";
import { Metadata } from "next";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import { CampaignWizard } from "@/features/campaign/components/CampaignWizard";

export const metadata: Metadata = {
  title: "Create Campaign | Toy Store Admin",
  description: "Create a new notification marketing campaign",
};

export default function NewCampaignPage() {
  return (
    <div>
      <PageBreadcrumb
        pageTitle="Create Campaign"
        breadcrumbs={[{ label: "Campaigns", href: "/admin/campaigns" }]}
      />
      <CampaignWizard />
    </div>
  );
}
