import { z } from "zod";

export const cancelOrderSchema = z.object({
  reason: z.string().min(1, "Please enter cancellation reason"),
});

export type CancelOrderFormData = z.infer<typeof cancelOrderSchema>;

export const shipOrderSchema = z.object({
  provider: z.string().min(1, "Please select shipping provider"),
  serviceType: z.string().optional(),
  note: z.string().optional(),
});

export type ShipOrderFormData = z.infer<typeof shipOrderSchema>;

export const assignOrderSchema = z.object({
  targetAccountId: z.coerce.number().min(1, "Please select staff"),
  note: z.string().optional(),
});

export type AssignOrderFormData = z.infer<typeof assignOrderSchema>;
