import { z } from "zod";

export const brandFormSchema = z.object({
  brandName: z
    .string()
    .trim()
    .min(2, "Brand name must be at least 2 characters.")
    .max(100, "Brand name must not exceed 100 characters."),
  status: z.enum(["Active", "Inactive"]),
});

export type BrandFormValues = z.infer<typeof brandFormSchema>;
