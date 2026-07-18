import { z } from "zod";

export const cancelOrderSchema = z.object({
  reason: z
    .string()
    .trim()
    .min(1, "Please enter cancellation reason")
    .max(400, "Reason must not exceed 400 characters"),
});

export type CancelOrderFormData = z.infer<typeof cancelOrderSchema>;

export const shipOrderSchema = z.object({
  provider: z.string().min(1, "Please select shipping provider"),
  serviceType: z.string().optional(),
  note: z.string().trim().max(400, "Note must not exceed 400 characters").optional(),
});

export type ShipOrderFormData = z.infer<typeof shipOrderSchema>;

export const assignOrderSchema = z.object({
  targetScheduleId: z.coerce.number().min(1, "Please select a schedule"),
  roleId: z.coerce.number().min(1),
  note: z.string().trim().max(400, "Note must not exceed 400 characters").optional(),
});

export type AssignOrderFormData = z.infer<typeof assignOrderSchema>;

export const confirmOrderSchema = z.object({
  note: z.string().trim().max(400, "Note must not exceed 400 characters").optional(),
});

export type ConfirmOrderFormData = z.infer<typeof confirmOrderSchema>;

export const processOrderSchema = z.object({
  note: z.string().trim().max(400, "Note must not exceed 400 characters").optional(),
});

export type ProcessOrderFormData = z.infer<typeof processOrderSchema>;

