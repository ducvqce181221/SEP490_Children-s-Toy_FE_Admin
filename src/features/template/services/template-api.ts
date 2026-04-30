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
    startDate?: string,
    endDate?: string
  ) => {
    return axiosClient.get<unknown, PaginatedTemplates>("/templates", {
      params: {
        pageNumber,
        pageSize,
        ...(sortBy && { sortBy }),
        sortDesc,
        ...(searchTerm && { searchTerm }),
        ...(isActive !== undefined && { isActive }),
        ...(startDate && { startDate }),
        ...(endDate && { endDate })
      },
    });
  },

  createTemplate: (data: TemplateFormData) => 
    axiosClient.post<unknown, Template>("/templates", data),

  updateTemplate: (id: number, data: TemplateFormData) =>
    axiosClient.put<unknown, Template>(`/templates/${id}`, data),
};
