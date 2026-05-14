export type ProductSortBy = "productname" | "price" | "quantity" | "createdat";

export type InventoryReportFormat = "pdf" | "xlsx" | "csv";

export type InventoryReportDateField = "createdat" | "updatedat";

export interface ProductListItem {
  productId: number;
  productName: string;
  price: number;
  quantity: number;
  productStatus: string;
  status: "Active" | "Inactive";
  categoryId: number;
  categoryName: string;
  brandId: number | null;
  brandName: string | null;
  mainImageUrl: string | null;
  createdAt: string;
}

export interface ProductDetail {
  productId: number;
  productName: string;
  price: number;
  quantity: number;
  productStatus: string;
  launchDate: string | null;
  stockThreshold: number;
  lowStockNotificationEnabled: boolean;
  lastLowStockNotifiedAt: string | null;
  categoryId: number;
  categoryName: string;
  brandId: number | null;
  brandName: string | null;
  priceRangeId: number | null;
  priceRangeMin: number | null;
  priceRangeMax: number | null;
  description: string | null;
  materialId: number | null;
  materialName: string | null;
  ageId: number | null;
  ageRange: string | null;
  sexId: number | null;
  sexName: string | null;
  originId: number | null;
  originName: string | null;
  mainImageUrl: string | null;
  additionalImageUrls: string[];
  createdAt: string;
  updatedAt: string | null;
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

export interface ProductQueryParams {
  pageNumber: number;
  pageSize: number;
  sortBy?: ProductSortBy;
  sortDesc?: boolean;
  searchTerm?: string;
  brandId?: number | null;
  categoryId?: number | null;
  status?: string;
}

export interface ApiErrorResponse {
  code: string;
  message: string;
}

export interface ValidationErrorResponse extends ApiErrorResponse {
  errors: Record<string, string[]>;
}

export interface ProductMutationResult {
  success: boolean;
  message: string;
  validationErrors?: Record<string, string[]>;
  data?: ProductDetail;
}

export interface ProductLookupOption {
  id: number;
  label: string;
}

export interface ProductCategoryLookup extends ProductLookupOption {
  superCategoryId: number;
  superCategoryName: string;
}

export interface ProductBrandLookup extends ProductLookupOption {}

export interface ProductSuperCategoryLookup extends ProductLookupOption {}

export interface ProductPriceRangeLookup extends ProductLookupOption {
  min: number;
  max: number;
}

export interface ProductLookupsResponse {
  superCategories: ProductSuperCategoryLookup[];
  categories: ProductCategoryLookup[];
  brands: ProductBrandLookup[];
  priceRanges: ProductPriceRangeLookup[];
  materials: ProductLookupOption[];
  ages: ProductLookupOption[];
  sexes: ProductLookupOption[];
  origins: ProductLookupOption[];
}

export interface InventoryReportRequest {
  format: InventoryReportFormat;
  searchTerm?: string;
  sortBy?: ProductSortBy;
  sortDesc?: boolean;
  categoryId?: number | null;
  brandId?: number | null;
  priceRangeId?: number | null;
  materialId?: number | null;
  ageId?: number | null;
  originId?: number | null;
  status?: string;
  lowStockOnly?: boolean;
  dateFrom?: string;
  dateTo?: string;
  dateField?: InventoryReportDateField;
}
