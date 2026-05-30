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
function timeToMinutes(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

const TIME_REGEX = /^([01]\d|2[0-3]):([0-5]\d)(:([0-5]\d))?$/;

export const ShiftTemplateSchema = z
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
      .number()
      .int("Must be a whole number")
      .min(1, "Minimum 1 order per shift")
      .max(200, "Max orders per shift must not exceed 200"),
    isActive: z.boolean(),
  })
  .superRefine((data, ctx) => {
    const startOk = TIME_REGEX.test(data.startTime);
    const endOk = TIME_REGEX.test(data.endTime);

    if (startOk && endOk) {
      const startMin = timeToMinutes(data.startTime);
      const endMin = timeToMinutes(data.endTime);

      if (endMin <= startMin) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["endTime"],
          message: "End time must be later than start time",
        });
      }
    }
  });

export type ShiftTemplateFormData = z.infer<typeof ShiftTemplateSchema>;
