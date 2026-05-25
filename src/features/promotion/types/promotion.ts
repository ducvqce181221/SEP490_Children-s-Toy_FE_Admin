export type { PromotionFormData, PromotionProductSlotFormData } from "./promotion.schema";

export const PROMOTION_TYPES = {
  DISCOUNT: "DISCOUNT",
  FLASH_SALE: "FLASH_SALE",
} as const;

export type PromotionTypeKey = typeof PROMOTION_TYPES[keyof typeof PROMOTION_TYPES];

export const PROMOTION_TYPE_CONFIG: Record<string, { label: string; hasTimeSlots: boolean }> = {
  [PROMOTION_TYPES.DISCOUNT]: {
    label: "Discount",
    hasTimeSlots: false,
  },
  [PROMOTION_TYPES.FLASH_SALE]: {
    label: "Flash Sale",
    hasTimeSlots: true,
  },
} as const;

export const PROMOTION_TYPE_OPTIONS = Object.entries(PROMOTION_TYPE_CONFIG).map(
  ([value, config]) => ({
    value,
    label: config.label,
  })
);

// ─── Read interfaces (responses từ API) ──────────────────────────────────────

export interface Promotion {
  promotionId: number;
  promotionName: string;
  promotionType: string;
  description: string | null;
  startDate: string;
  endDate: string;
  status: string;
  priority: number;
  createdAt: string;
  updatedAt: string | null;
  /** Sản phẩm tham gia promotion DISCOUNT */
  productPromotions: ProductPromotion[];
  /** Khung giờ flash-sale (FLASH_SALE). Mỗi slot chứa promotionProductSlots riêng */
  promotionTimeSlots: PromotionTimeSlot[];
}

/** Sản phẩm trong promotion DISCOUNT (cấp promotion, không phân slot) */
export interface ProductPromotion {
  productId: number;
  productName: string;
  originalPrice: number;
  salePrice: number;
  discountPercent: number | null;
  saleQuantity: number | null;
  soldQuantity: number;
  reservedQuantity: number;
  stock: number;
}

/** Khung giờ Flash Sale — StartAt/EndAt là UTC ISO 8601 string */
export interface PromotionTimeSlot {
  timeSlotId: number;
  promotionId: number;
  /** UTC ISO 8601 string, ví dụ: "2026-05-04T02:00:00Z" */
  startAt: string;
  /** UTC ISO 8601 string, ví dụ: "2026-05-04T05:00:00Z" */
  endAt: string;
  status: string;
  /** Sản phẩm tham gia slot này */
  promotionProductSlots: PromotionProductSlot[];
}

/** Sản phẩm trong một slot cụ thể (FLASH_SALE) */
export interface PromotionProductSlot {
  slotProductId: number;
  timeSlotId: number;
  productId: number;
  productName: string;
  originalPrice: number;
  salePrice: number;
  discountPercent: number | null;
  saleQuantity: number;
  soldQuantity: number;
  reservedQuantity: number;
}

// ─── List DTO ─────────────────────────────────────────────────────────────────

export interface PromotionListDto {
  promotionId: number;
  promotionName: string;
  promotionType: string;
  startDate: string;
  endDate: string;
  status: string;
  priority: number;
  createdAt: string;
}

// ─── Create/Update DTOs (gửi lên API) ─────────────────────────────────────────

export interface CreateProductPromotionDto {
  productId: number;
  salePrice: number;
  discountPercent: number | null;
  saleQuantity: number | null;
}

/** Gửi kèm trong CreatePromotionTimeSlotDto */
export interface CreatePromotionProductSlotDto {
  productId: number;
  salePrice: number;
  discountPercent: number | null;
  /** Bắt buộc, phải > 0 với FLASH_SALE */
  saleQuantity: number;
}

/** Tạo/cập nhật time slot FLASH_SALE — startAt/endAt là UTC ISO 8601 */
export interface CreatePromotionTimeSlotDto {
  /** UTC ISO 8601 string */
  startAt: string;
  /** UTC ISO 8601 string */
  endAt: string;
  status: string;
  promotionProductSlots: CreatePromotionProductSlotDto[];
}

// ─── Shared API types ─────────────────────────────────────────────────────────

export interface PaginatedResponse<T> {
  items: T[];
  pageNumber: number;
  pageSize: number;
  totalPages: number;
  totalCount: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}

export interface ApiErrorResponse {
  code?: string;
  message: string;
}

export interface ValidationErrorResponse extends ApiErrorResponse {
  errors?: Record<string, string[]>;
}
