import axiosClient from "@/configs/axios-client";
import { Template, TemplateFormData, PaginatedTemplates } from "../types/template";

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

  updateTemplate: (id: number, data: TemplateFormData) =>
    axiosClient.put<Template, TemplateFormData>(`/templates/${id}`, data),
};
