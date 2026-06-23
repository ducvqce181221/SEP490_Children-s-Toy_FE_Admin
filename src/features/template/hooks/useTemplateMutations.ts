import { useState } from "react";
import { TemplateFormData, UpdateTemplatePayload } from "../types/template";
import { templateApi } from "../services/template-api";
import toast from "react-hot-toast";
import { getTemplateMutationErrorMessage } from "../utils/template-errors";

export const useTemplateMutations = (onSuccess?: () => void) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const createTemplate = async (data: TemplateFormData) => {
    setIsSubmitting(true);
    try {
      await templateApi.createTemplate(data);
      toast.success("Template created successfully");
      onSuccess?.();
      return true;
    } catch (error) {
      toast.error(getTemplateMutationErrorMessage(error, "Failed to create template"));
      if (process.env.NODE_ENV === "development") {
        console.error("[useTemplateMutations.createTemplate]", error);
      }
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  const saveTemplate = async (id: number, data: UpdateTemplatePayload) => {
    setIsSubmitting(true);
    const isDelete = "isDeleted" in data && data.isDeleted;
    try {
      await templateApi.saveTemplate(id, data);
      toast.success(isDelete ? "Template deleted successfully" : "Template updated successfully");
      onSuccess?.();
      return true;
    } catch (error) {
      toast.error(getTemplateMutationErrorMessage(error, isDelete ? "Failed to delete template" : "Update failed"));
      if (process.env.NODE_ENV === "development") {
        console.error("[useTemplateMutations.saveTemplate]", error);
      }
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  return { createTemplate, saveTemplate, isSubmitting };
};
