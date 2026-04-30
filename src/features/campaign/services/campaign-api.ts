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
} from "../types/campaign";

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
    axiosClient.get<unknown, PaginatedCampaigns>("/campaigns", {
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
    axiosClient.get<unknown, Campaign>(`/campaigns/${id}`),

  createCampaign: (data: CampaignPayload | CampaignFormData) =>
    axiosClient.post<unknown, Campaign>("/campaigns", data),

  updateCampaign: (id: number, data: CampaignPayload) =>
    axiosClient.put<unknown, Campaign>(`/campaigns/${id}`, data),

  cancelCampaign: (id: number) =>
    axiosClient.post<unknown, void>(`/campaigns/${id}/cancel`),

  getReferenceTypes: () =>
    axiosClient.get<unknown, ReferenceTypeInfo[]>("/campaigns/reference-types"),

  // ─── Campaign Deliveries (recipient list) ───────────────────────────────

  getCampaignDeliveries: (
    campaignId: number,
    pageNumber = 1,
    pageSize = 10,
    status?: string
  ) =>
    axiosClient.get<unknown, PaginatedDeliveries>(
      `/campaigns/${campaignId}/deliveries`,
      { params: { pageNumber, pageSize, ...(status && { status }) } }
    ),
};

// ─── Templates ────────────────────────────────────────────────────────────────

export const templateApi = {
  getActiveTemplates: () =>
    axiosClient
      .get<unknown, PaginatedTemplates>("/templates", {
        params: { pageNumber: 1, pageSize: 100, isActive: true },
      })
      .then((res) => res.items || []),
};

// ─── Reference object search (for wizard step 1) ──────────────────────────────

export const referenceSearchApi = {
  searchVouchers: (searchTerm?: string): Promise<VoucherSearchItem[]> =>
    axiosClient
      .get<unknown, { items: VoucherSearchItem[] }>("/vouchers", {
        params: { pageNumber: 1, pageSize: 20, ...(searchTerm && { searchTerm }) },
      })
      .then((res) => res.items || []),

  searchProducts: (searchTerm?: string): Promise<ProductSearchItem[]> =>
    axiosClient
      .get<unknown, { items: ProductSearchItem[] }>("/products", {
        params: { pageNumber: 1, pageSize: 20, ...(searchTerm && { searchTerm }) },
      })
      .then((res) => res.items || []),

  searchBlogPosts: (searchTerm?: string): Promise<BlogPostSearchItem[]> =>
    axiosClient
      .get<unknown, { items: BlogPostSearchItem[] }>("/blog-posts", {
        params: { pageNumber: 1, pageSize: 20, ...(searchTerm && { searchTerm }) },
      })
      .then((res) => res.items || []),

  searchPromotions: (searchTerm?: string): Promise<PromotionSearchItem[]> =>
    axiosClient
      .get<unknown, { items: PromotionSearchItem[] }>("/promotions", {
        params: { pageNumber: 1, pageSize: 20, ...(searchTerm && { searchTerm }) },
      })
      .then((res) => res.items || []),
};

// ─── Roles & Accounts (for wizard step 3 targeting) ───────────────────────────

export const audienceApi = {
  getRoles: (): Promise<RoleItem[]> =>
    axiosClient
      .get<unknown, RoleItem[] | { items: RoleItem[] }>("/roles")
      .then((res) => (Array.isArray(res) ? res : (res as { items: RoleItem[] }).items || [])),

  searchAccounts: (searchTerm: string): Promise<AccountSearchItem[]> =>
    axiosClient
      .get<unknown, { items: AccountSearchItem[] }>("/accounts", {
        params: { pageNumber: 1, pageSize: 20, searchTerm },
      })
      .then((res) => res.items || []),
};
