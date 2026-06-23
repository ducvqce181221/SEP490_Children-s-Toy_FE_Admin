import axiosClient from "@/configs/axios-client";
import {
  Campaign,
  CampaignListItem,
  CampaignFormData,
  ReferenceTypeInfo,
  NotificationTemplate,
  VoucherSearchItem,
  ProductSearchItem,
  BlogPostSearchItem,
  PromotionSearchItem,
  RoleItem,
  AccountSearchItem,
  PaginatedDeliveries,
  ReviewCampaignDto,
  ScheduleCampaignDto,
  ScheduleCampaignResultDto,
  RescheduleCampaignDto,
  CampaignScheduleBounds,
} from "../types/campaign";
import { normalizeCampaignFromApi } from "../utils/normalize-campaign-from-api";

export interface PaginatedCampaigns {
  items: CampaignListItem[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
}

export interface CampaignPayload {
  campaignName: string;
  templateCode?: string | null;
  referenceType?: string | null;
  referenceId?: number | null;
  titleOverride?: string | null;
  messageOverride?: string | null;
  sourceType: string;
  targetType: string;
  scheduledAt?: string | null;
  imageUrl?: string | null;
  actionType?: string | null;
  actionTarget?: string | null;
  createdByAccountId?: number;
  targets: { targetType: string; targetValue: string }[];
}

export interface PaginatedTemplates {
  items: NotificationTemplate[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
}

// ─── Campaign CRUD ────────────────────────────────────────────────────────────

export const campaignApi = {
  getCampaigns: (
    pageNumber = 1,
    pageSize = 10,
    sortBy?: string,
    sortDesc = false,
    searchTerm?: string,
    status?: string,
    sourceType?: string
  ) =>
    axiosClient.get<PaginatedCampaigns>("/campaigns", {
      params: {
        pageNumber,
        pageSize,
        ...(sortBy && { sortBy }),
        sortDesc,
        ...(searchTerm && { searchTerm }),
        ...(status && { status }),
        ...(sourceType && { sourceType }),
      },
    }),

  getCampaignById: (id: number) =>
    axiosClient.get<Campaign>(`/campaigns/${id}`).then((c) => normalizeCampaignFromApi(c)),

  getScheduleBounds: (id: number) =>
    axiosClient.get<CampaignScheduleBounds>(`/campaigns/${id}/schedule-bounds`),

  createCampaign: (data: CampaignPayload | CampaignFormData) =>
    axiosClient.post<Campaign, CampaignPayload | CampaignFormData>("/campaigns", data),

  updateCampaign: (id: number, data: CampaignPayload) =>
    axiosClient.put<Campaign, CampaignPayload>(`/campaigns/${id}`, data),

  cancelCampaign: (id: number) =>
    axiosClient.post<void>(`/campaigns/${id}/cancel`),

  deleteCampaign: (id: number) =>
    axiosClient.delete<void>(`/campaigns/${id}`),

  submitCampaign: (id: number) =>
    axiosClient.post<void>(`/campaigns/${id}/submit`),

  reviewCampaign: (id: number, data: ReviewCampaignDto) =>
    axiosClient.post<void>(`/campaigns/${id}/review`, data),

  scheduleCampaign: (id: number, data: ScheduleCampaignDto) =>
    axiosClient.post<ScheduleCampaignResultDto>(`/campaigns/${id}/schedule`, data),

  rescheduleCampaign: (id: number, data: RescheduleCampaignDto) =>
    axiosClient.post<ScheduleCampaignResultDto>(`/campaigns/${id}/reschedule`, data),

  recallCampaign: (id: number) =>
    axiosClient.post<void>(`/campaigns/${id}/recall`),

  getReferenceTypes: () =>
    axiosClient.get<ReferenceTypeInfo[]>("/campaigns/reference-types"),

  // ─── Campaign Deliveries (recipient list) ───────────────────────────────

  getCampaignDeliveries: (
    campaignId: number,
    pageNumber = 1,
    pageSize = 10,
    status?: string
  ) =>
    axiosClient.get<PaginatedDeliveries>(
      `/campaigns/${campaignId}/deliveries`,
      { params: { pageNumber, pageSize, ...(status && { status }) } }
    ),
};

// ─── Templates ────────────────────────────────────────────────────────────────

export const templateApi = {
  getActiveTemplates: () =>
    axiosClient
      .get<PaginatedTemplates>("/templates", {
        params: { pageNumber: 1, pageSize: 100, isActive: true },
      })
      .then((res) => res.items || []),
};

// ─── Reference object search (for wizard step 1) ──────────────────────────────

export const referenceSearchApi = {
  searchVouchers: (searchTerm?: string): Promise<VoucherSearchItem[]> =>
    axiosClient
      .get<{ items: VoucherSearchItem[] }>("/vouchers", {
        params: { pageNumber: 1, pageSize: 20, ...(searchTerm && { searchTerm }) },
      })
      .then((res) => res.items || []),

  searchProducts: (searchTerm?: string): Promise<ProductSearchItem[]> =>
    axiosClient
      .get<{ items: ProductSearchItem[] }>("/products", {
        params: { pageNumber: 1, pageSize: 20, ...(searchTerm && { searchTerm }) },
      })
      .then((res) => res.items || []),

  searchBlogPosts: (searchTerm?: string): Promise<BlogPostSearchItem[]> =>
    axiosClient
      .get<{ items: BlogPostSearchItem[] }>("/customer/blogs", {
        params: {
          pageNumber: 1,
          pageSize: 20,
          status: "Published",
          ...(searchTerm && { searchTerm }),
        },
      })
      .then((res) => res.items || []),

  searchPromotions: (searchTerm?: string): Promise<PromotionSearchItem[]> =>
    axiosClient
      .get<{ items: PromotionSearchItem[] }>("/promotions", {
        params: { pageNumber: 1, pageSize: 20, ...(searchTerm && { searchTerm }) },
      })
      .then((res) => res.items || []),
};

// ─── Roles & Accounts (for wizard step 3 targeting) ───────────────────────────

export const audienceApi = {
  getRoles: (): Promise<RoleItem[]> =>
    axiosClient
      .get<RoleItem[] | { items: RoleItem[] }>("/roles")
      .then((res) => (Array.isArray(res) ? res : (res as { items: RoleItem[] }).items || [])),

  searchAccounts: (searchTerm: string): Promise<AccountSearchItem[]> =>
    axiosClient
      .get<{ items: any[] }>("/customers", {
        params: { pageNumber: 1, pageSize: 20, searchTerm },
      })
      .then((res) =>
        (res.items || []).map((item) => ({
          accountId: item.accountId,
          accountName: item.accountName,
          email: item.email,
          imageUrl: item.imageUrl,
          roleId: 1,
        }))
      ),
};
