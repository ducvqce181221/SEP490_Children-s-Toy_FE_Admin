export type { CampaignFormData } from "./campaign.schema";

// ─── Sub-types ────────────────────────────────────────────────────────────────

export interface CampaignTarget {
  campaignTargetId: number;
  targetType: string;
  targetValue: string;
}

export interface CampaignStat {
  statId: number;
  totalSent: number;
  totalRead: number;
  totalClicked: number;
  computedAt: string;
}

export interface ReferenceTypeInfo {
  referenceType: string;
  displayName: string;
  placeholders: { token: string; description: string }[];
}

export interface ResolvedReference {
  displayName?: string | null;
  placeholders: Record<string, string>;
  defaultActionTarget?: string | null;
}

// ─── Full Campaign detail (GET /campaigns/{id}) ────────────────────────────────

export interface Campaign {
  campaignId: number;
  campaignName: string;
  templateCode?: string | null;
  referenceType?: string | null;
  referenceId?: number | null;
  resolvedReference?: ResolvedReference | null;
  titleOverride?: string | null;
  messageOverride?: string | null;
  sourceType: string;
  targetType: string;
  status: string;
  scheduledAt?: string | null;
  eventKey?: string | null;
  imageUrl?: string | null;
  actionType?: string | null;
  actionTarget?: string | null;
  createdByAccountId: number;
  createdAt: string;
  updatedAt?: string | null;
  stat?: CampaignStat | null;
  targets: CampaignTarget[];
}

// ─── List item (GET /campaigns paged list) ────────────────────────────────────

export interface CampaignListItem {
  campaignId: number;
  campaignName: string;
  templateCode?: string | null;
  referenceType?: string | null;
  sourceType: string;
  targetType: string;
  status: string;
  scheduledAt?: string | null;
  imageUrl?: string | null;
  createdByAccountId: number;
  createdAt: string;
  updatedAt?: string | null;
}

// ─── Template ────────────────────────────────────────────────────────────────

export interface NotificationTemplate {
  templateId: number;
  templateCode: string;
  titleTemplate: string;
  messageTemplate: string;
  isActive: boolean;
  createdAt: string;
}

// ─── Reference object search results ─────────────────────────────────────────

export interface VoucherSearchItem {
  voucherId: number;
  voucherCode: string;
  voucherName: string;
  discountType: string;
  discountValue: number;
  endDate: string;
  status: string;
}

export interface ProductSearchItem {
  productId: number;
  productName: string;
  price: number;
  productStatus: string;
}

export interface BlogPostSearchItem {
  blogPostId: number;
  blogTitle: string;
  status: string;
  blogAt?: string | null;
}

export interface PromotionSearchItem {
  promotionId: number;
  promotionName: string;
  promotionType: string;
  startDate: string;
  endDate: string;
  status: string;
}

export type ReferenceSearchItem =
  | (VoucherSearchItem & { _type: "VOUCHER" })
  | (ProductSearchItem & { _type: "PRODUCT" })
  | (BlogPostSearchItem & { _type: "BLOG" })
  | (PromotionSearchItem & { _type: "SALE" });

// ─── Role (for audience targeting) ───────────────────────────────────────────

export interface RoleItem {
  roleId: number;
  roleName: string;
  description?: string | null;
}

// ─── Account search (for individual targeting) ────────────────────────────────

export interface AccountSearchItem {
  accountId: number;
  accountName: string;
  email: string;
  imageUrl?: string | null;
  roleId: number;
}

// ─── Campaign Deliveries (recipient list) ─────────────────────────────────────

export interface CampaignDelivery {
  deliveryId: number;
  accountName: string;
  email: string;
  imageUrl?: string | null;
  status: string; // "Unread" | "Read" | "Archived" | "Deleted"
  readAt?: string | null;
  createdAt: string;
}

export interface PaginatedDeliveries {
  items: CampaignDelivery[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
}

// ─── Wizard form state (not the API DTO) ──────────────────────────────────────

export interface WizardState {
  // Step 1
  campaignName: string;
  referenceType: string; // "" = general, "VOUCHER"|"PRODUCT"|"BLOG"|"SALE"
  referenceId: number | null;
  resolvedObject: ResolvedReference | null;
  referenceDisplayName: string;

  // Step 2
  templateCode: string;
  selectedTemplate: NotificationTemplate | null;
  useCustomContent: boolean;
  titleOverride: string;
  messageOverride: string;
  imageUrl: string;

  // Step 3
  targetMode: "ALL" | "ROLE" | "INDIVIDUAL" | "SEGMENT";
  selectedRoleId: string;
  individualAccountIds: number[];
  individualAccountNames: string[];
  segmentName: string;
  scheduleType: "immediate" | "scheduled";
  scheduledAt: string;
}
