import { z } from "zod";

export const TemplateFormSchema = z.object({
  templateCode: z
    .string()
    .min(3, "Template code must be at least 3 characters.")
    .max(50, "Template code must not exceed 50 characters.")
    .regex(/^[A-Za-z0-9_-]+$/, "Template code must contain only letters, numbers, underscores, or hyphens."),
  
  titleTemplate: z
    .string()
    .min(3, "Title must be at least 3 characters.")
    .max(255, "Title must not exceed 255 characters."),
  
  messageTemplate: z
    .string()
    .min(3, "Message must be at least 3 characters.")
    .max(500, "Message must not exceed 500 characters."),
    
  isActive: z.boolean(),
});

export type TemplateFormDataSchema = z.infer<typeof TemplateFormSchema>;