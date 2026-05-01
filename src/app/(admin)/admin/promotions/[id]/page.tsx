"use client";

import { use, useEffect } from "react";
import { useRouter } from "next/navigation";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import { PromotionForm } from "@/features/promotion/components/PromotionForm";
import { usePromotionDetail } from "@/features/promotion/hooks/usePromotions";

export default function EditPromotionPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = use(params);
  const promotionId = parseInt(id, 10);

  const { promotion, isLoading, error } = usePromotionDetail(promotionId);

  useEffect(() => {
    if (isNaN(promotionId)) {
      router.push("/admin/promotions");
    }
  }, [promotionId, router]);

  if (isNaN(promotionId)) return null;

  if (isLoading) {
    return (
      <div>
        <PageBreadcrumb pageTitle="Edit Promotion" />
        <div className="flex justify-center items-center min-h-[400px]">
          <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (error || !promotion) {
    return (
      <div>
        <PageBreadcrumb pageTitle="Edit Promotion" />
        <div className="p-6">
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <p className="text-sm">{error || "Không tìm thấy khuyến mãi"}</p>
            <button
              onClick={() => router.push("/admin/promotions")}
              className="mt-4 text-brand-500 text-sm underline"
            >
              Quay lại danh sách
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageBreadcrumb pageTitle={`Edit Promotion #${promotionId}`} />
      <div className="space-y-6">
        <PromotionForm initialData={promotion} />
      </div>
    </div>
  );
}
