import { z } from "zod";
import { TemplateFormSchema } from "./template.schema";

export interface Template {
  templateId: number;
  templateCode: string;
  usageScope: string;
  titleTemplate: string;
  messageTemplate: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string | null;
}

export type TemplateFormData = z.infer<typeof TemplateFormSchema>;

export interface PaginatedTemplates {
  items: Template[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}
