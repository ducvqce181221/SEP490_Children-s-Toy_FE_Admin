import { z } from "zod";
import { getMinimumFutureTime } from "@/utils/date-utils";

export const VoucherFormSchema = z.object({
  voucherCode: z
    .string()
    .min(3, "Voucher code must be at least 3 characters.")
    .max(30, "Voucher code must not exceed 30 characters.")
    .regex(/^[A-Za-z0-9_-]+$/, "Voucher code must contain only letters, numbers, underscores, or hyphens."),
  
  voucherName: z
    .string()
    .min(3, "Voucher name must be at least 3 characters.")
    .max(255, "Voucher name must not exceed 255 characters."),
  
  voucherDescription: z
    .string()
    .min(3, "Voucher description must be at least 3 characters.")
    .max(255, "Voucher description must not exceed 255 characters."),
  
  // SỬA LỖI 1: Đổi 'errorMap' thành 'message'
  discountType: z
    .enum(["FIXED", "PERCENTAGE"], { 
      message: "Discount type must be either FIXED or PERCENTAGE." 
    }),
  
  // SỬA LỖI 2: Đổi 'invalid_type_error' thành 'message'
  discountValue: z
    .number({ message: "Discount value is required." })
    .gt(0, "Discount value must be greater than 0.")
    .lte(1_000_000_000, "Discount value must not exceed 1,000,000,000."),
  
  maxDiscountCap: z
    .number()
    .gt(0, "Max discount cap must be greater than 0 when provided.")
    .nullable()
    .optional(),
  
  // SỬA LỖI 3: Đổi 'errorMap' thành 'message'
  discountTarget: z
    .enum(["ORDER_TOTAL", "SHIPPING_FEE", "FINAL_PRICE"], { 
      message: "Discount target must be either ORDER_TOTAL, SHIPPING_FEE, or FINAL_PRICE." 
    }),
  
  minOrderAmount: z
    .number()
    .gte(0, "Minimum order amount must be greater than or equal to 0 when provided.")
    .nullable()
    .optional(),
  
  totalQuantity: z
    .number()
    .gt(0, "Total quantity must be greater than 0 when provided.")
    .nullable()
    .optional(),
  
  maxUsagePerUser: z
    .number()
    .gte(1, "Max usage per user must be greater than or equal to 1 when provided.")
    .nullable()
    .optional(),
  
  startDate: z
    .string()
    .min(1, "Start date is required."),
  
  endDate: z
    .string()
    .min(1, "End date is required."),
  
  // SỬA LỖI 4: Đổi 'errorMap' thành 'message'
  status: z
    .enum(["Scheduled", "Active", "Inactive", "Expired", "Pending", "Rejected"], { 
      message: "Status must be one of Scheduled, Active, Inactive, Expired, Pending, or Rejected." 
    }),
})
.refine(data => {
  if (data.discountType === "PERCENTAGE" && data.discountValue > 100) {
    return false;
  }
  return true;
}, {
  message: "Discount value must be less than or equal to 100 for percentage vouchers.",
  path: ["discountValue"]
})
.refine(data => {
  // Đối với FIXED, giá trị giảm giá không được lớn hơn mức chi tiêu tối thiểu (nếu có)
  if (data.discountType === "FIXED" && data.minOrderAmount !== null && data.minOrderAmount !== undefined) {
    return data.discountValue <= data.minOrderAmount;
  }
  return true;
}, {
  message: "Discount value cannot be greater than the minimum order amount for fixed vouchers.",
  path: ["discountValue"]
})
.refine(data => {
  if (data.discountType === "FIXED" && data.maxDiscountCap !== null && data.maxDiscountCap !== undefined) {
    return false;
  }
  return true;
}, {
  message: "Max discount cap is only allowed for percentage vouchers.",
  path: ["maxDiscountCap"]
})
.refine(data => {
  const start = new Date(data.startDate);
  const end = new Date(data.endDate);
  // Ensure valid dates before comparison
  if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
    return start < end;
  }
  return true; // Let the min(1) rule handle empty strings
}, {
  message: "Start date must be earlier than end date.",
  path: ["endDate"]
})
.refine(data => {
  const start = new Date(data.startDate);
  const minFutureTime = getMinimumFutureTime(); 
  return start.getTime() >= minFutureTime;
}, {
  message: "Start date must be at least 10 minutes from now.",
  path: ["startDate"]
})

.refine(data => {
  if (data.totalQuantity !== null && data.totalQuantity !== undefined && data.maxUsagePerUser !== null && data.maxUsagePerUser !== undefined) {
    return data.maxUsagePerUser <= data.totalQuantity;
  }
  return true;
}, {
  message: "Max usage per user must be less than or equal to total quantity.",
  path: ["maxUsagePerUser"]
})
.refine(data => {
  if (data.discountType === "PERCENTAGE" && (data.maxDiscountCap === null || data.maxDiscountCap === undefined)) {
    return false;
  }
  return true;
}, {
  message: "Max discount cap is required for percentage vouchers.",
  path: ["maxDiscountCap"]
});

export type VoucherFormDataSchema = z.infer<typeof VoucherFormSchema>;