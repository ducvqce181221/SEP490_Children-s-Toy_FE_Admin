import { z } from "zod";
import { VoucherFormSchema } from "./voucher.schema";

export interface Voucher {
  voucherId: number;
  createdBy: number | null;
  voucherCode: string;
  voucherName: string;
  voucherDescription: string;
  discountType: string;
  discountValue: number;
  maxDiscountCap: number | null;
  discountTarget: string;
  minOrderAmount: number | null;
  totalQuantity: number | null;
  usedQuantity: number;
  maxUsagePerUser: number | null;
  startDate: string;
  endDate: string;
  status: string;
  createdAt: string;
  updatedAt: string | null;
}

export type VoucherFormData = z.infer<typeof VoucherFormSchema>;

export interface PaginatedVouchers {
  items: Voucher[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}
