export type { PromotionFormData } from "./promotion.schema";

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
  productPromotions: ProductPromotion[];
}

export interface ProductPromotion {
  productId: number;
  productName: string;
  salePrice: number;
  discountPercent: number | null;
  saleQuantity: number | null;
  soldQuantity: number;
  reservedQuantity: number;
  isActive: boolean;
}

export interface CreateProductPromotionDto {
  productId: number;
  salePrice: number;
  discountPercent: number | null;
  saleQuantity: number | null;
  isActive: boolean;
}

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

export interface PaginatedResponse<T> {
  items: T[];
  pageNumber: number;
  pageSize: number;
  totalPages: number;
  totalCount: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}
