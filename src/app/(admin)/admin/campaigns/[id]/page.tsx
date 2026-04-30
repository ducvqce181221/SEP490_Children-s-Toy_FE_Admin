import React from "react";
import { Metadata } from "next";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import { CampaignDetailPage } from "@/features/campaign/components/CampaignDetailPage";

export const metadata: Metadata = {
  title: "Chi tiết chiến dịch | Toy Store Admin",
  description: "Xem chi tiết và kết quả của chiến dịch thông báo",
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
        <p className="text-gray-500">Không tìm thấy chiến dịch</p>
      </div>
    );
  }

  return (
    <div>
      <PageBreadcrumb pageTitle="Chi tiết chiến dịch" />
      <CampaignDetailPage campaignId={campaignId} />
    </div>
  );
}
