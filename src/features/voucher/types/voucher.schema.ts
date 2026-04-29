import { z } from "zod";

export const VoucherFormSchema = z.object({
  voucherCode: z.string().min(1, "Voucher Code is required").max(50, "Max 50 characters").regex(/^[A-Z0-9\-]+$/, "Code must contain only uppercase letters, numbers, and hyphens"),
  voucherName: z.string().min(1, "Voucher Name is required").max(100, "Max 100 characters"),
  voucherDescription: z.string().max(500, "Max 500 characters").optional().default(""),
  discountType: z.string().min(1, "Discount Type is required"),
  discountValue: z.number().min(0, "Discount value must be at least 0"),
  maxDiscountCap: z.number().nullable().optional(),
  discountTarget: z.string().min(1, "Discount Target is required"),
  minOrderAmount: z.number().nullable().optional(),
  totalQuantity: z.number().nullable().optional(),
  maxUsagePerUser: z.number().nullable().optional(),
  startDate: z.string().min(1, "Start Date is required"),
  endDate: z.string().min(1, "End Date is required"),
  status: z.string().min(1, "Status is required"),
}).refine(data => {
  if (data.discountType === "PERCENTAGE" && data.discountValue > 100) {
    return false;
  }
  return true;
}, {
  message: "Percentage discount cannot exceed 100%",
  path: ["discountValue"]
}).refine(data => {
  return new Date(data.startDate) < new Date(data.endDate);
}, {
  message: "End Date must be after Start Date",
  path: ["endDate"]
});
