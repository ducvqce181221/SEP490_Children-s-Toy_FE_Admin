import { z } from "zod";

export const SuperCategoryFormSchema = z.object({
  superCategoryName: z
    .string()
    .min(1, "Tên danh mục lớn không được để trống")
    .max(100, "Tên danh mục lớn không được vượt quá 100 ký tự"),
});

export type SuperCategoryFormData = z.infer<typeof SuperCategoryFormSchema>;
