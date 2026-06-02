import { z } from "zod";

export const cancelOrderSchema = z.object({
  reason: z
    .string()
    .min(1, "Please enter cancellation reason")
    .max(500, "Reason must not exceed 500 characters"),
});

export type CancelOrderFormData = z.infer<typeof cancelOrderSchema>;

export const shipOrderSchema = z.object({
  provider: z.string().min(1, "Please select shipping provider"),
  serviceType: z.string().optional(),
  note: z.string().optional(),
});

export type ShipOrderFormData = z.infer<typeof shipOrderSchema>;

export const assignOrderSchema = z.object({
  targetScheduleId: z.coerce.number().min(1, "Please select a schedule"),
  roleId: z.coerce.number().min(1),
  note: z.string().optional(),
});

export type AssignOrderFormData = z.infer<typeof assignOrderSchema>;
