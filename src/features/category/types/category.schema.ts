import { z } from "zod";

export const CategoryFormSchema = z.object({
  superCategoryId: z.number({
    required_error: "Please select a super category",
    invalid_type_error: "Invalid super category",
  }).min(1, "Please select a super category"),
  categoryName: z
    .string()
    .min(1, "Category name is required")
    .max(100, "Category name must not exceed 100 characters"),
  status: z.enum(["Active", "Inactive"]),
});

export type CategoryFormData = z.infer<typeof CategoryFormSchema>;
