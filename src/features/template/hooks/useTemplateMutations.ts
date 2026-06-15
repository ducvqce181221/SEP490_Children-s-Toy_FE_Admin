import { useState } from "react";
import { TemplateFormData } from "../types/template";
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

  const updateTemplate = async (id: number, data: TemplateFormData) => {
    setIsSubmitting(true);
    try {
      await templateApi.updateTemplate(id, data);
      toast.success("Template updated successfully");
      onSuccess?.();
      return true;
    } catch (error) {
      toast.error(getTemplateMutationErrorMessage(error, "Update failed"));
      if (process.env.NODE_ENV === "development") {
        console.error("[useTemplateMutations.updateTemplate]", error);
      }
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  const deleteTemplate = async (id: number) => {
    setIsSubmitting(true);
    try {
      await templateApi.deleteTemplate(id);
      toast.success("Template deleted successfully");
      onSuccess?.();
      return true;
    } catch (error) {
      toast.error(getTemplateMutationErrorMessage(error, "Failed to delete template"));
      if (process.env.NODE_ENV === "development") {
        console.error("[useTemplateMutations.deleteTemplate]", error);
      }
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  return { createTemplate, updateTemplate, deleteTemplate, isSubmitting };
};
