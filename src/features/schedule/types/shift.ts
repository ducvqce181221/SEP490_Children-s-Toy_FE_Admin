import { z } from "zod";

export interface ShiftTemplate {
  shiftTemplateId: number;
  shiftName: string;
  startTime: string; // "HH:mm:ss"
  endTime: string;   // "HH:mm:ss"
  maxOrdersPerShift: number;
  isActive: boolean;
  activeScheduleCount?: number;
  createdAt?: string;
  updatedAt?: string;
}

// Helper: convert "HH:mm" or "HH:mm:ss" to total minutes since midnight
export function timeToMinutes(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

export function formatDuration(start: string, end: string): string | null {
  const timeRe = /^([01]\d|2[0-3]):([0-5]\d)/;
  if (!timeRe.test(start) || !timeRe.test(end)) return null;
  const diff = timeToMinutes(end) - timeToMinutes(start);
  if (diff <= 0) return null;
  const h = Math.floor(diff / 60);
  const m = diff % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

const TIME_REGEX = /^([01]\d|2[0-3]):([0-5]\d)(:([0-5]\d))?$/;

// Schema used for Create — all fields required
export const ShiftTemplateCreateSchema = z
  .object({
    shiftName: z
      .string()
      .min(2, "Shift name must be at least 2 characters")
      .max(50, "Shift name must not exceed 50 characters"),
    startTime: z
      .string()
      .min(1, "Start time is required")
      .regex(TIME_REGEX, "Invalid start time (HH:mm)"),
    endTime: z
      .string()
      .min(1, "End time is required")
      .regex(TIME_REGEX, "Invalid end time (HH:mm)"),
    maxOrdersPerShift: z
      .number({ message: "Please enter a number" })
      .int("Must be a whole number")
      .min(1, "Minimum 1 order per shift")
      .max(200, "Max orders per shift must not exceed 200"),
    isActive: z.boolean(),
  })
  .superRefine((data, ctx) => {
    if (TIME_REGEX.test(data.startTime) && TIME_REGEX.test(data.endTime)) {
      if (timeToMinutes(data.endTime) <= timeToMinutes(data.startTime)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["endTime"],
          message: "End time must be later than start time",
        });
      }
    }
  });

// Schema used for Update when time is locked — only validate name + maxOrders
export const ShiftTemplateLockedUpdateSchema = z.object({
  shiftName: z
    .string()
    .min(2, "Shift name must be at least 2 characters")
    .max(50, "Shift name must not exceed 50 characters"),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  maxOrdersPerShift: z
    .number({ message: "Please enter a number" })
    .int("Must be a whole number")
    .min(1, "Minimum 1 order per shift")
    .max(200, "Max orders per shift must not exceed 200"),
  isActive: z.boolean(),
});

// Schema dùng cho Update thường (không khóa)
export const ShiftTemplateUpdateSchema = ShiftTemplateCreateSchema;

// Giữ alias cũ để không break các file dùng ShiftTemplateSchema
export const ShiftTemplateSchema = ShiftTemplateCreateSchema;

export type ShiftTemplateFormData = z.infer<typeof ShiftTemplateCreateSchema>;

// Payload gửi lên PUT — chỉ các field thực sự thay đổi
export type ShiftTemplateUpdatePayload = {
  shiftName?: string;
  startTime?: string;
  endTime?: string;
  maxOrdersPerShift?: number;
  isActive?: boolean;
};
