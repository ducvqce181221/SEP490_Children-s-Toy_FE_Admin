import { z } from "zod";

export const productPromotionSchema = z.object({
  productId: z.number(),
  productName: z.string().optional(),
  salePrice: z.number().min(0, "Giá sale phải lớn hơn hoặc bằng 0"),
  discountPercent: z.number().min(0, "Discount phải >= 0").max(100, "Discount <= 100").nullable(),
  saleQuantity: z.number().min(1, "Số lượng phải lớn hơn 0").nullable(),
  isActive: z.boolean().default(true),
});

export const promotionFormSchema = z
  .object({
    promotionName: z.string().min(1, "Tên chương trình là bắt buộc").max(100, "Tối đa 100 ký tự"),
    promotionType: z.string().min(1, "Loại chương trình là bắt buộc"),
    description: z.string().nullable(),
    startDate: z.string().min(1, "Ngày bắt đầu là bắt buộc"),
    endDate: z.string().min(1, "Ngày kết thúc là bắt buộc"),
    status: z.string().min(1, "Trạng thái là bắt buộc"),
    priority: z.preprocess((v) => Number(v), z.number().min(0, "Mức ưu tiên phải >= 0")),
    productPromotions: z.array(productPromotionSchema).default([]),
  })
  .refine(
    (data) => {
      const start = new Date(data.startDate).getTime();
      const end = new Date(data.endDate).getTime();
      return end > start;
    },
    {
      message: "Ngày kết thúc phải sau ngày bắt đầu",
      path: ["endDate"],
    }
  );

export type PromotionFormData = z.infer<typeof promotionFormSchema>;
