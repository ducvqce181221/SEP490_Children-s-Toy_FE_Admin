import React from "react";
import { Metadata } from "next";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import { CampaignWizard } from "@/features/campaign/components/CampaignWizard";

export const metadata: Metadata = {
  title: "Chỉnh sửa chiến dịch | Toy Store Admin",
  description: "Cập nhật thông tin chiến dịch thông báo",
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
        <p className="text-gray-500">Không tìm thấy chiến dịch</p>
      </div>
    );
  }

  return (
    <div>
      <PageBreadcrumb pageTitle="Chỉnh sửa chiến dịch" />
      <CampaignWizard campaignId={campaignId} />
    </div>
  );
}
