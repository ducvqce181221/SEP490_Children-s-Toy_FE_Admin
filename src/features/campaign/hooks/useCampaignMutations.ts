import { useState } from "react";
import toast from "react-hot-toast";
import { campaignApi, CampaignPayload } from "../services/campaign-api";
import { CampaignFormData, ReviewCampaignDto, RescheduleCampaignDto, ScheduleCampaignDto } from "../types/campaign";
import {
  getCampaignMutationErrorMessage,
  parseCampaignValidationErrors,
  translateScheduleWarningCodes,
} from "../utils/campaign-errors";

export type CampaignReviewResult = {
  success: boolean;
  reviewNoteError?: string;
};

// ─── Hook ─────────────────────────────────────────────────────────────────────

export const useCampaignMutations = (onSuccess?: () => void) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const createCampaign = async (data: CampaignFormData): Promise<boolean> => {
    setIsSubmitting(true);
    try {
      await campaignApi.createCampaign(data);
      toast.success("Campaign created successfully!");
      onSuccess?.();
      return true;
    } catch (error) {
      toast.error(getCampaignMutationErrorMessage(error, "Unable to create campaign. Please check your input."));
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
      await campaignApi.updateCampaign(id, data as CampaignPayload);
      toast.success("Campaign updated successfully!");
      onSuccess?.();
      return true;
    } catch (error) {
      toast.error(getCampaignMutationErrorMessage(error, "Unable to update campaign. Please check your input."));
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  const cancelCampaign = async (id: number): Promise<boolean> => {
    setIsSubmitting(true);
    try {
      await campaignApi.cancelCampaign(id);
      toast.success("Campaign has been cancelled.");
      onSuccess?.();
      return true;
    } catch (error) {
      toast.error(getCampaignMutationErrorMessage(error, "Unable to cancel campaign."));
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  const submitCampaign = async (id: number): Promise<boolean> => {
    setIsSubmitting(true);
    try {
      await campaignApi.submitCampaign(id);
      toast.success("Campaign submitted for approval.");
      onSuccess?.();
      return true;
    } catch (error) {
      toast.error(getCampaignMutationErrorMessage(error, "Unable to submit for approval."));
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  const reviewCampaign = async (id: number, data: ReviewCampaignDto): Promise<CampaignReviewResult> => {
    setIsSubmitting(true);
    try {
      await campaignApi.reviewCampaign(id, data);
      const actionText = data.action === "Approved" ? "approved" : "rejected";
      toast.success(`Campaign has been ${actionText}.`);
      onSuccess?.();
      return { success: true };
    } catch (error) {
      toast.error(getCampaignMutationErrorMessage(error, "Unable to update review status."));
      const fieldErrors = parseCampaignValidationErrors(error);
      return {
        success: false,
        reviewNoteError: fieldErrors.reviewNote,
      };
    } finally {
      setIsSubmitting(false);
    }
  };

  const scheduleCampaign = async (id: number, data: ScheduleCampaignDto): Promise<boolean> => {
    setIsSubmitting(true);
    try {
      const result = await campaignApi.scheduleCampaign(id, data);
      toast.success("Campaign scheduled.");
      const warn = translateScheduleWarningCodes(result.warningCodes);
      if (warn) {
        toast(warn, { duration: 6500 });
      }
      onSuccess?.();
      return true;
    } catch (error) {
      toast.error(getCampaignMutationErrorMessage(error, "Unable to schedule campaign."));
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  const rescheduleCampaign = async (id: number, data: RescheduleCampaignDto): Promise<boolean> => {
    setIsSubmitting(true);
    try {
      const result = await campaignApi.rescheduleCampaign(id, data);
      toast.success("Campaign rescheduled.");
      const warn = translateScheduleWarningCodes(result.warningCodes);
      if (warn) {
        toast(warn, { duration: 6500 });
      }
      onSuccess?.();
      return true;
    } catch (error) {
      toast.error(getCampaignMutationErrorMessage(error, "Unable to reschedule campaign."));
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  const recallCampaign = async (id: number): Promise<boolean> => {
    setIsSubmitting(true);
    try {
      await campaignApi.recallCampaign(id);
      toast.success("Campaign recalled to draft.");
      onSuccess?.();
      return true;
    } catch (error) {
      toast.error(getCampaignMutationErrorMessage(error, "Unable to recall campaign."));
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  const deleteCampaign = async (id: number): Promise<boolean> => {
    setIsSubmitting(true);
    try {
      await campaignApi.deleteCampaign(id);
      toast.success("Campaign deleted successfully!");
      onSuccess?.();
      return true;
    } catch (error) {
      toast.error(getCampaignMutationErrorMessage(error, "Unable to delete campaign."));
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    createCampaign,
    updateCampaign,
    cancelCampaign,
    submitCampaign,
    reviewCampaign,
    scheduleCampaign,
    rescheduleCampaign,
    recallCampaign,
    deleteCampaign,
    isSubmitting,
  };
};
