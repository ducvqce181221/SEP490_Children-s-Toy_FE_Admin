import React from "react";
import { Metadata } from "next";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import { CampaignDetailPage } from "@/features/campaign/components/CampaignDetailPage";

export const metadata: Metadata = {
  title: "Campaign Detail | Toy Store Admin",
  description: "View campaign details and delivery results",
};

interface Props {
  params: Promise<{ id: string }>;
}

export default async function CampaignDetailRoute({ params }: Props) {
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
        pageTitle="Campaign Detail"
        breadcrumbs={[{ label: "Campaigns", href: "/admin/campaigns" }]}
      />
      <CampaignDetailPage campaignId={campaignId} />
    </div>
  );
}
