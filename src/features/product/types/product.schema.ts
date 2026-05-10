import { z } from "zod";

export const ProductFormSchema = z.object({
  productName: z
    .string()
    .min(1, "Product name is required")
    .max(255, "Product name cannot exceed 255 characters"),
  categoryId: z
    .number({ message: "Category is required" })
    .min(1, "Category is required"),
  brandId: z.number().nullable().optional(),
  priceRangeId: z.number().nullable().optional(),
  price: z
    .number({ message: "Price is required" })
    .min(0, "Price cannot be negative"),
  quantity: z
    .number({ message: "Quantity is required" })
    .min(0, "Quantity cannot be negative"),
  productStatus: z.string().min(1, "Status is required"),
  launchDate: z.string().nullable().optional(),
  stockThreshold: z.number().min(0).default(10),
  lowStockNotificationEnabled: z.boolean().default(true),
  description: z.string().nullable().optional(),
  materialId: z.number().nullable().optional(),
  ageId: z.number().nullable().optional(),
  sexId: z.number().nullable().optional(),
  originId: z.number().nullable().optional(),
  mainImageUrl: z.string().nullable().optional(),
  additionalImageUrls: z
    .array(z.string().url())
    .min(4, "At least 4 additional images are required")
    .max(6, "Maximum 6 additional images")
    .default([]),
});

export type ProductFormData = z.infer<typeof ProductFormSchema>;
