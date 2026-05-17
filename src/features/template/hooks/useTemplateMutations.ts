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
      toast.success("Tạo template thành công");
      onSuccess?.();
      return true;
    } catch (error) {
      toast.error(getTemplateMutationErrorMessage(error, "Tạo template thất bại"));
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
      toast.success("Cập nhật template thành công");
      onSuccess?.();
      return true;
    } catch (error) {
      toast.error(getTemplateMutationErrorMessage(error, "Cập nhật thất bại"));
      if (process.env.NODE_ENV === "development") {
        console.error("[useTemplateMutations.updateTemplate]", error);
      }
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  return { createTemplate, updateTemplate, isSubmitting };
};
