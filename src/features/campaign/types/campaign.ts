export type { CampaignFormData } from "./campaign.schema";

export interface CampaignFilters {
  status: string;
  sourceType: string;
}


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

/** A product associated within a flash sale time slot. */
export interface ResolvedFlashProductLine {
  slotProductId: number;
  productId: number;
  productName: string;
  imageUrl?: string | null;
  salePrice: number;
  discountPercent?: number | null;
  saleQuantity: number;
  soldQuantity: number;
  reservedQuantity: number;
  isActive: boolean;
}

/** Flash sale time slot (UTC) — API embedded in resolved reference for FLASH_SALE. */
export interface ResolvedFlashTimeSlot {
  timeSlotId: number;
  startAtUtc: string;
  endAtUtc: string;
  status: string;
  productLines?: ResolvedFlashProductLine[] | null;
}

export interface ResolvedReference {
  displayName?: string | null;
  imageUrl?: string | null;
  /** SALE: FLASH_SALE | DISCOUNT | … from API */
  promotionType?: string | null;
  placeholders: Record<string, string>;
  defaultActionTarget?: string | null;
  /** Only with FLASH_SALE: time slot used to align when scheduling send time. */
  flashTimeSlots?: ResolvedFlashTimeSlot[] | null;
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
  resolvedTitle?: string | null;
  resolvedMessage?: string | null;
  sourceType: string;
  targetType: string;
  status: string;
  scheduledAt?: string | null;
  eventKey?: string | null;
  imageUrl?: string | null;
  actionType?: string | null;
  actionTarget?: string | null;
  createdByAccountId: number;
  createdByAccountName?: string | null;
  createdAt: string;
  updatedAt?: string | null;

  // Audit Fields
  submittedByAccountId?: number | null;
  submittedByAccountName?: string | null;
  submittedAt?: string | null;
  reviewedByAccountId?: number | null;
  reviewedByAccountName?: string | null;
  reviewedAt?: string | null;
  reviewNote?: string | null;

  validFrom?: string | null;
  validTo?: string | null;
  approvedExpireAt?: string | null;
  rescheduleCount?: number;
  maxRescheduleCount?: number;

  stat?: CampaignStat | null;
  targets: CampaignTarget[];
}

export interface ReviewCampaignDto {
  action: "Approved" | "Rejected";
  reviewNote?: string | null;
}

export interface ScheduleCampaignDto {
  scheduledAt: string | null;
  validFrom?: string | null;
  validTo?: string | null;
}

export interface RescheduleCampaignDto {
  newScheduledAt: string;
  reason?: string | null;
}

export interface ScheduleCampaignResultDto {
  warningCodes?: string[] | null;
}

/** GET /campaigns/{id}/schedule-bounds */
export interface CampaignScheduleBounds {
  earliestUtc: string;
  latestUtc: string;
  isFeasible: boolean;
  referenceType?: string | null;
  promotionType?: string | null;
  referenceRulesApplied: boolean;
  referenceHintWarning?: string | null;
  minLeadMinutes?: number;
  maxFutureDays?: number;
  voucherEndBufferHours?: number;
  saleLeadWindowHours?: number;
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
  rescheduleCount?: number;
  maxRescheduleCount?: number;
}

// ─── Template ────────────────────────────────────────────────────────────────

export interface NotificationTemplate {
  templateId: number;
  templateCode: string;
  usageScope: string;
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
  isClicked?: boolean;
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
  referenceType: string; // "" = general, "VOUCHER"|"PRODUCT"|"BLOG"|"SALE"|"OTHER"
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
  imageFile: File | null;
  imagePreviewUrl: string;

  // Step 3
  targetMode: "ALL" | "ROLE" | "INDIVIDUAL";
  selectedRoleId: string;
  individualAccountIds: number[];
  individualAccountNames: string[];
}
