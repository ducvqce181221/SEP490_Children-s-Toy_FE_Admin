import { useState } from "react";
import toast from "react-hot-toast";
import { AxiosError } from "axios";
import { campaignApi, CampaignPayload } from "../services/campaign-api";
import { CampaignFormData } from "../types/campaign";

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Trích message từ lỗi 400 (interceptor im lặng với 400).
 * Các lỗi 403/404/500 đã được interceptor toast → trả về null để không toast lại.
 */
function get400Message(error: unknown, fallback: string): string | null {
  const axiosError = error as AxiosError<{ message?: string }>;
  if (axiosError?.response?.status !== 400) return null;
  return axiosError.response?.data?.message ?? fallback;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export const useCampaignMutations = (onSuccess?: () => void) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const createCampaign = async (data: CampaignFormData): Promise<boolean> => {
    setIsSubmitting(true);
    try {
      await campaignApi.createCampaign(data);
      toast.success("Tạo chiến dịch thành công!");
      onSuccess?.();
      return true;
    } catch (error) {
      const message = get400Message(error, "Dữ liệu không hợp lệ. Vui lòng kiểm tra lại.");
      if (message) toast.error(message);
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateCampaign = async (
    id: number,
    data: CampaignFormData | CampaignPayload,
  ): Promise<boolean> => {
    setIsSubmitting(true);
    try {
      // CampaignFormData và CampaignPayload nên được normalize ở service layer
      await campaignApi.updateCampaign(id, data as CampaignPayload);
      toast.success("Cập nhật chiến dịch thành công!");
      onSuccess?.();
      return true;
    } catch (error) {
      const message = get400Message(error, "Dữ liệu không hợp lệ. Vui lòng kiểm tra lại.");
      if (message) toast.error(message);
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  // FIX: dùng isSubmitting thay vì state riêng để nhất quán
  const cancelCampaign = async (id: number): Promise<boolean> => {
    setIsSubmitting(true);
    try {
      await campaignApi.cancelCampaign(id);
      toast.success("Đã huỷ chiến dịch.");
      onSuccess?.();
      return true;
    } catch (error) {
      const message = get400Message(error, "Không thể huỷ chiến dịch.");
      if (message) toast.error(message);
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    createCampaign,
    updateCampaign,
    cancelCampaign,
    isSubmitting,
  };
};