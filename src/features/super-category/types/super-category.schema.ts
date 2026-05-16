import { z } from "zod";

export const SuperCategoryFormSchema = z.object({
  superCategoryName: z
    .string()
    .min(1, "Super category name is required")
    .max(100, "Super category name must not exceed 100 characters"),
  status: z.enum(["Active", "Inactive"]),
});

export type SuperCategoryFormData = z.infer<typeof SuperCategoryFormSchema>;
