import React from "react";
import { Metadata } from "next";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import { CampaignWizard } from "@/features/campaign/components/CampaignWizard";

export const metadata: Metadata = {
  title: "Edit Campaign | Toy Store Admin",
  description: "Update campaign notification information",
};

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditCampaignPage({ params }: Props) {
  const { id } = await params;
  const campaignId = parseInt(id, 10);

  if (isNaN(campaignId)) {
    return (
      <div className="flex items-center justify-center py-24">
        <p className="text-gray-500">Campaign not found</p>
      </div>
    );
  }

  return (
    <div>
      <PageBreadcrumb
        pageTitle="Edit Campaign"
        breadcrumbs={[{ label: "Campaigns", href: "/admin/campaigns" }]}
      />
      <CampaignWizard campaignId={campaignId} />
    </div>
  );
}
