import axiosClient from "@/configs/axios-client";
import { Template, UpdateTemplatePayload, TemplateFormData, PaginatedTemplates } from "../types/template";

export const templateApi = {
  getTemplates: (
    pageNumber = 1,
    pageSize = 10,
    sortBy?: string,
    sortDesc = false,
    searchTerm?: string,
    isActive?: boolean,
    usageScope?: "SYSTEM" | "ADMIN",
    startDate?: string,
    endDate?: string
  ) => {
    return axiosClient.get<PaginatedTemplates>("/templates", {
      params: {
        pageNumber,
        pageSize,
        ...(sortBy && { sortBy }),
        sortDesc,
        ...(searchTerm && { searchTerm }),
        ...(isActive !== undefined && { isActive }),
        ...(usageScope && { usageScope }),
        ...(startDate && { startDate }),
        ...(endDate && { endDate })
      },
    });
  },

  createTemplate: (data: TemplateFormData) =>
    axiosClient.post<Template, TemplateFormData>("/templates", data),

  saveTemplate: (id: number, data: UpdateTemplatePayload) =>
    axiosClient.put<Template | void, UpdateTemplatePayload>(`/templates/${id}`, data),
};
