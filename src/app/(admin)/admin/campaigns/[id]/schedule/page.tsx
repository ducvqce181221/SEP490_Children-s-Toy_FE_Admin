import React, { Suspense } from "react";
import { Metadata } from "next";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import { CampaignScheduleWizard } from "@/features/campaign/components/CampaignScheduleWizard";

export const metadata: Metadata = {
  title: "Schedule Campaign | Toy Store Admin",
  description: "Set or change schedule for campaign notifications",
};

interface Props {
  params: Promise<{ id: string }>;
}

function ScheduleFallback() {
  return (
    <div className="flex items-center justify-center py-24">
      <div className="text-center text-sm text-gray-500">Loading...</div>
    </div>
  );
}

export default async function CampaignSchedulePage({ params }: Props) {
  const { id } = await params;
  const campaignId = parseInt(id, 10);

  if (Number.isNaN(campaignId)) {
    return (
      <div className="flex items-center justify-center py-24">
        <p className="text-gray-500">Campaign not found.</p>
      </div>
    );
  }

  return (
    <div>
      <PageBreadcrumb
        pageTitle="Schedule Delivery"
        breadcrumbs={[
          { label: "Campaigns", href: "/admin/campaigns" },
          { label: "Detail", href: `/admin/campaigns/${campaignId}` },
        ]}
      />
      <Suspense fallback={<ScheduleFallback />}>
        <CampaignScheduleWizard campaignId={campaignId} />
      </Suspense>
    </div>
  );
}
