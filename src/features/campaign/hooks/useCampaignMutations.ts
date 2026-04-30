import { useState } from "react";
import { campaignApi, CampaignPayload } from "../services/campaign-api";
import { CampaignFormData } from "../types/campaign";
import toast from "react-hot-toast";

export const useCampaignMutations = (onSuccess?: () => void) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const createCampaign = async (data: CampaignFormData) => {
    setIsSubmitting(true);
    try {
      await campaignApi.createCampaign(data);
      toast.success("Tạo chiến dịch thành công!");
      onSuccess?.();
      return true;
    } catch (err: any) {
      const errMsg = err.response?.data?.message || "Tạo chiến dịch thất bại";
      toast.error(errMsg);
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateCampaign = async (id: number, data: CampaignFormData | CampaignPayload) => {
    setIsSubmitting(true);
    try {
      await campaignApi.updateCampaign(id, data as CampaignPayload);
      toast.success("Cập nhật chiến dịch thành công!");
      onSuccess?.();
      return true;
    } catch (err: any) {
      const errMsg = err.response?.data?.message || "Cập nhật chiến dịch thất bại";
      toast.error(errMsg);
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  const cancelCampaign = async (id: number) => {
    try {
      await campaignApi.cancelCampaign(id);
      toast.success("Hủy chiến dịch thành công!");
      onSuccess?.();
      return true;
    } catch (err: any) {
      const errMsg = err.response?.data?.message || "Hủy chiến dịch thất bại";
      toast.error(errMsg);
      return false;
    }
  };

  return {
    createCampaign,
    updateCampaign,
    cancelCampaign,
    isSubmitting,
  };
};
