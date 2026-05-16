import { z } from "zod";

export interface ShiftTemplate {
  shiftTemplateId: number;
  shiftName: string;
  startTime: string; // "HH:mm:ss"
  endTime: string;   // "HH:mm:ss"
  maxOrdersPerShift: number;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
}

export const ShiftTemplateSchema = z.object({
  shiftName: z.string().min(1, "Shift name is required"),
  startTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)(:([0-5]\d))?$/, "Invalid time format (HH:mm)"),
  endTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)(:([0-5]\d))?$/, "Invalid time format (HH:mm)"),
  maxOrdersPerShift: z.number().min(1, "Minimum 1 order per shift"),
  isActive: z.boolean(),
});

export type ShiftTemplateFormData = z.infer<typeof ShiftTemplateSchema>;
