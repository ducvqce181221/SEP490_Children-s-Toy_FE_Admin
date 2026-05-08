import { z } from "zod";

export const cancelOrderSchema = z.object({
  reason: z.string().min(1, "Vui lòng nhập lý do hủy đơn"),
});

export type CancelOrderFormData = z.infer<typeof cancelOrderSchema>;

export const shipOrderSchema = z.object({
  provider: z.string().min(1, "Vui lòng chọn đơn vị vận chuyển"),
  serviceType: z.string().optional(),
  note: z.string().optional(),
});

export type ShipOrderFormData = z.infer<typeof shipOrderSchema>;

export const assignOrderSchema = z.object({
  targetAccountId: z.coerce.number().min(1, "Vui lòng chọn nhân viên"),
  note: z.string().optional(),
});

export type AssignOrderFormData = z.infer<typeof assignOrderSchema>;
