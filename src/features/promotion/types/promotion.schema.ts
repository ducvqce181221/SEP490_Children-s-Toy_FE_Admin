import { z } from "zod";

export const productPromotionSchema = z.object({
  productId: z.number(),
  productName: z.string().optional(),
  originalPrice: z.number().optional(),
  stock: z.number().optional(),
  salePrice: z.preprocess(
    (val) => (val === "" || val === undefined || (typeof val === "number" && isNaN(val)) ? null : val),
    z.number().min(0, "Sale price must be at least 0")
  ),
  discountPercent: z.preprocess(
    (val) => (val === "" || val === undefined || (typeof val === "number" && isNaN(val)) ? null : val),
    z.number()
      .min(1, "Discount must be at least 1%")
      .max(99, "Discount must be at most 99%")
      .nullable()
  ),
  saleQuantity: z.preprocess(
    (val) => (val === "" || val === undefined || (typeof val === "number" && isNaN(val)) ? null : val),
    z.number().min(1, "Quantity must be greater than 0").nullable()
  ),
  isActive: z.boolean().default(true),
}).refine(data => {
  if (data.originalPrice !== undefined) {
    return data.salePrice <= data.originalPrice;
  }
  return true;
}, {
  message: "Sale price must be less than or equal to original price",
  path: ["salePrice"]
}).refine(data => {
  if (data.saleQuantity !== null && data.saleQuantity !== undefined && data.stock !== undefined) {
    return data.saleQuantity <= data.stock;
  }
  return true;
}, {
  message: "Quantity cannot exceed available stock",
  path: ["saleQuantity"]
});

export const promotionFormSchema = z
  .object({
    promotionName: z.string().min(1, "Promotion name is required").max(100, "Maximum 100 characters"),
    promotionType: z.string().min(1, "Promotion type is required"),
    description: z.string().nullable(),
    startDate: z.string().min(1, "Start date is required"),
    endDate: z.string().min(1, "End date is required"),
    status: z.string().min(1, "Status is required"),
    priority: z.preprocess((v) => Number(v), z.number().min(0, "Priority must be at least 0")),
    productPromotions: z.array(productPromotionSchema).default([]),
  })
  .refine(
    (data) => {
      const start = new Date(data.startDate).getTime();
      const end = new Date(data.endDate).getTime();
      return end > start;
    },
    {
      message: "End date must be after start date",
      path: ["endDate"],
    }
  );

export type PromotionFormData = z.infer<typeof promotionFormSchema>;
