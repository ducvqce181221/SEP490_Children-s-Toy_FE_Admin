import { z } from "zod";

export const updateCustomerSchema = z.object({
  isActive: z.enum(["active", "inactive"]),
});

export type UpdateCustomerFormValues = z.infer<typeof updateCustomerSchema>;
