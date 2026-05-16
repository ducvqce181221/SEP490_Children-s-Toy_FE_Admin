import { z } from "zod";

export const blogFormSchema = z.object({
  blogCategoryId: z
    .union([z.number(), z.string()])
    .transform((v) => (typeof v === "string" ? Number(v) : v))
    .pipe(z.number().int().min(1, "Blog category is required.")),
  blogTitle: z
    .string()
    .trim()
    .min(1, "Blog title is required.")
    .max(255, "Blog title must not exceed 255 characters."),
  blogContent: z
    .string()
    .trim()
    .min(1, "Blog content is required.")
    .max(3000, "Blog content must not exceed 3000 characters."),
  blogThumbnail: z
    .string()
    .trim()
    .max(500, "Thumbnail URL must not exceed 500 characters.")
    .or(z.literal("")),
  blogAt: z.string().optional(),
});

export type BlogFormValues = z.infer<typeof blogFormSchema>;
export type BlogFormInput = z.input<typeof blogFormSchema>;
