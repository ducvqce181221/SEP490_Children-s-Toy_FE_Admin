import { z } from "zod";

export const CategoryFormSchema = z.object({
  superCategoryId: z.number({
    required_error: "Vui lòng chọn danh mục lớn",
    invalid_type_error: "Danh mục lớn không hợp lệ",
  }).min(1, "Vui lòng chọn danh mục lớn"),
  categoryName: z
    .string()
    .min(1, "Tên danh mục không được để trống")
    .max(100, "Tên danh mục không được vượt quá 100 ký tự"),
});

export type CategoryFormData = z.infer<typeof CategoryFormSchema>;
